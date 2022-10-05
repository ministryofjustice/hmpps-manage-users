import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import bunyanMiddleware from 'bunyan-middleware'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import hsts from 'hsts'
import csurf from 'csurf'
import noCache from 'nocache'

import setUpWebSecurity from '../backend/middleware/setUpWebSecurity'
import authorisationMiddleware from '../backend/middleware/authorisationMiddleware'
import { buildAppInsightsClient, initialiseAppInsights } from '../backend/utils/azureAppInsights'

import apis from '../backend/apis'
import ensureHttps from '../backend/middleware/ensureHttps'
import healthFactory from '../backend/services/healthCheck'
import setupAuth from '../backend/middleware/setUpAuth'
import routes from '../backend/routes'
import setupWebSession from '../backend/middleware/setupWebSession'
import config from './config'
import setupStaticContent from '../backend/setupStaticContent'
import nunjucksSetup from '../backend/utils/nunjucksSetup'
import phaseNameSetup from '../backend/phaseNameSetup'
import errorHandler from '../backend/middleware/errorHandler'
import log from '../backend/log'

// Do appinsights first as it does some magic instrumentation work, i.e. it affects other 'require's
// In particular, applicationinsights automatically collects bunyan logs
initialiseAppInsights()
buildAppInsightsClient()

require('express-async-errors')
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config()

const sixtyDaysInSeconds = 5184000

export default function createApp(): express.Application {
  const app = express()

  app.set('port', config.app.port)
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
    health((err: unknown, result: { status: string }) => {
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

  if (config.production) {
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
    // eslint-disable-next-line no-param-reassign,@typescript-eslint/ban-ts-comment
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
  return app
}
