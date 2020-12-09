require('dotenv').config()
// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
require('./azure-appinsights')

const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const bunyanMiddleware = require('bunyan-middleware')
const hsts = require('hsts')
const helmet = require('helmet')
const noCache = require('nocache')
const apis = require('./apis')

const ensureHttps = require('./middleware/ensureHttps')

const healthFactory = require('./services/healthCheck')

const setupAuth = require('./setupAuth')

const routes = require('./routes')

const setupWebSession = require('./setupWebSession')
const config = require('./config')

const setupStaticContent = require('./setupStaticContent')
const nunjucksSetup = require('./nunjucksSetup')

const log = require('./log')

const app = express()

const sixtyDaysInSeconds = 5184000

app.set('trust proxy', 1) // trust first proxy
app.set('view engine', 'njk')

nunjucksSetup(app, path)

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
)

app.use(
  hsts({
    maxAge: sixtyDaysInSeconds,
    includeSubDomains: true,
    preload: true,
  })
)

app.use(
  bunyanMiddleware({
    logger: log,
    obscureHeaders: ['Authorization'],
  })
)

const health = healthFactory(config.apis.oauth2.url, config.apis.prison.url, config.apis.tokenverification.url)

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

// Ensure cookie session is extended (once per minute) when user interacts with the server
app.use((req, res, next) => {
  // eslint-disable-next-line no-param-reassign
  // @ts-ignore
  req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
  next()
})
app.use(routes({ ...apis }))

app.get('/maintain*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'))
})
app.get('/create*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'))
})

app.listen(config.app.port, () => {
  // eslint-disable-next-line no-console
  console.log('Backend running on port', config.app.port)
})
