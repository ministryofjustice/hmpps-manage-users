import authorisationMiddleware from './middleware/authorisationMiddleware'
import setupStaticContent from './middleware/setupStaticContent'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setupWebSession from './middleware/setupWebSession'
import { buildAppInsightsClient, initialiseAppInsights } from './utils/azureAppInsights'

require('dotenv').config()
// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
initialiseAppInsights()
buildAppInsightsClient()

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const hsts = require('hsts')
const { csrfSync } = require('csrf-sync')
const noCache = require('nocache')

require('express-async-errors')

const apis = require('./apis')
const ensureHttps = require('./middleware/ensureHttps')
const healthFactory = require('./services/healthCheck')
const setupAuth = require('./middleware/setUpAuth')
const routes = require('./routes')
const config = require('./config').default
const nunjucksSetup = require('./utils/nunjucksSetup')
const phaseNameSetup = require('./phaseNameSetup')
const errorHandler = require('./middleware/errorHandler')

const sixtyDaysInSeconds = 5184000

const app = express()

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'njk')

nunjucksSetup(app, path)
phaseNameSetup(app, config)

app.use(setUpWebSecurity())
app.use(setupStaticContent())

app.use(
  hsts({
    maxAge: sixtyDaysInSeconds,
    includeSubDomains: true,
    preload: true,
  }),
)

const health = healthFactory(config.apis.hmppsAuth.url, config.apis.manageUsers.url, config.apis.tokenVerification.url)

app.get('/health', (req, res, next) => {
  health((err, result) => {
    if (err) {
      return next(err)
    }
    if (!(result.status === 'UP')) {
      res.status(503)
    }
    res.json(result)
    return result
  })
})

app.get('/ping', (req, res) => res.send('pong'))

app.get('/info', (req, res) => res.send({ productId: config.productId }))

if (config.app.production) {
  app.use(ensureHttps)
}

// Don't cache dynamic resources
app.use(noCache())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(setupStaticContent())

app.use(setupWebSession())
app.use(setupAuth({ oauthApi: apis.oauthApi, tokenVerificationApi: apis.tokenVerificationApi }))
app.use(authorisationMiddleware())

// Ensure cookie session is extended (once per minute) when user interacts with the server
app.use((req, res, next) => {
  // eslint-disable-next-line no-param-reassign
  // @ts-ignore
  req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
  next()
})

const testMode = process.env.NODE_ENV === 'test'

// CSRF protection
if (!testMode) {
  const {
    csrfSynchronisedProtection, // This is the default CSRF protection middleware.
  } = csrfSync({
    // By default, csrf-sync uses x-csrf-token header, but we use the token in forms and send it in the request body, so change getTokenFromRequest so it grabs from there
    getTokenFromRequest: (req) => {
      // eslint-disable-next-line no-underscore-dangle
      return req.body._csrf
    },
  })

  app.use(csrfSynchronisedProtection)
}
app.use((req, res, next) => {
  if (typeof req.csrfToken === 'function') {
    res.locals.csrfToken = req.csrfToken()
  }
  next()
})

app.use(routes({ ...apis }))

app.use(errorHandler)

app.listen(config.app.port, () => {
  // eslint-disable-next-line no-console
  // console.log('Backend running on port', config.app.port) // DO NOT uncomment this in the cloud, only locally. We don't want to expose the port number
  // eslint-disable-next-line no-console
  console.log('Backend running')
})
