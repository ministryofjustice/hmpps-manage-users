const express = require('express')
const passport = require('passport')
const flash = require('connect-flash')
const tokenRefresherFactory = require('../tokenRefresher').factory
const sessionManagementRoutes = require('../sessionManagementRoutes')
const auth = require('../authentication/auth')
const config = require('../config')

const router = express.Router()

module.exports = ({ oauthApi, tokenVerificationApi }) => {
  auth.default.init()
  const tokenRefresher = tokenRefresherFactory(oauthApi.refresh, config.app.tokenRefreshThresholdSeconds)

  router.use(passport.initialize())
  router.use(passport.session())
  router.use(flash())

  /* sign in, sign out, token refresh etc */
  sessionManagementRoutes.configureRoutes({
    app: router,
    tokenRefresher,
    tokenVerifier: tokenVerificationApi.verifyToken,
    homeLink: config.apis.oauth2.ui_url,
  })

  return router
}
