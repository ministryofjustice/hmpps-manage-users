import authorisationMiddleware from './middleware/authorisationMiddleware'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import setupWebSession from './middleware/setupWebSession'
import { buildAppInsightsClient, initialiseAppInsights } from './utils/azureAppInsights'

require('dotenv').config()
// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
initialiseAppInsights()
buildAppInsightsClient()
// TODO import auditService here and use

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const bunyanMiddleware = require('bunyan-middleware')
const hsts = require('hsts')
const csurf = require('csurf')
const noCache = require('nocache')

require('express-async-errors')

const apis = require('./apis')
const ensureHttps = require('./middleware/ensureHttps')
const healthFactory = require('./services/healthCheck')
const setupAuth = require('./middleware/setUpAuth')
const routes = require('./routes')
const config = require('./config').default
const setupStaticContent = require('./middleware/setupStaticContent')
const nunjucksSetup = require('./utils/nunjucksSetup')
const phaseNameSetup = require('./phaseNameSetup')
const errorHandler = require('./middleware/errorHandler')
const log = require('./log')

const sixtyDaysInSeconds = 5184000

const app = express()

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'njk')

nunjucksSetup(app, path)
phaseNameSetup(app, config)

app.use(setUpWebSecurity())

app.use(
  hsts({
    maxAge: sixtyDaysInSeconds,
    includeSubDomains: true,
    preload: true,
  }),
)

app.use(
  bunyanMiddleware({
    logger: log,
    obscureHeaders: ['Authorization'],
  }),
)

const health = healthFactory(
  config.apis.hmppsAuth.url,
  config.apis.manageUsers.url,
  config.apis.tokenVerification.url,
  config.apis.nomisUsersAndRoles.url,
)

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

// CSRF protection
app.use(csurf())
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
  console.log('Backend running on port', config.app.port)
})

