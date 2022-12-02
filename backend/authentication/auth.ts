import passport from 'passport'
import { Strategy } from 'passport-oauth2'

import config from '../config'
import { apiClientCredentials } from '../api/oauthApi'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

function init(): void {
  const strategy = new Strategy(
    {
      authorizationURL: `${config.apis.hmppsAuth.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.hmppsAuth.url}/oauth/token`,
      clientID: config.apis.hmppsAuth.apiClientId,
      clientSecret: config.apis.hmppsAuth.apiClientSecret,
      callbackURL: `${config.app.url}/sign-in/callback`,
      state: true,
      customHeaders: {
        Authorization: `Basic ${apiClientCredentials(
          config.apis.hmppsAuth.apiClientId,
          config.apis.hmppsAuth.apiClientSecret,
        )}`,
      },
    },
    (accessToken, refreshToken, params, profile, done) =>
      done(null, { access_token: accessToken, refresh_token: refreshToken, authSource: params.auth_source }),
  )
  passport.use(strategy)
}

export default {
  init,
}
