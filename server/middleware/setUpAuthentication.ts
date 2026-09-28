import passport from 'passport'
import flash from 'connect-flash'
import { Router } from 'express'
import { Strategy } from 'passport-oauth2'
import { VerificationClient, AuthenticatedRequest } from '@ministryofjustice/hmpps-auth-clients'
import config from '../config'
import { HmppsUser } from '../interfaces/hmppsUser'
import generateOauthClientToken from '../utils/clientCredentials'
import logger from '../../logger'

passport.serializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user)
})

passport.deserializeUser((user, done) => {
  // Not used but required for Passport
  done(null, user as Express.User)
})

passport.use(
  new Strategy(
    {
      authorizationURL: `${config.apis.hmppsAuth.externalUrl}/oauth/authorize`,
      tokenURL: `${config.apis.hmppsAuth.url}/oauth/token`,
      clientID: config.apis.hmppsAuth.authClientId,
      clientSecret: config.apis.hmppsAuth.authClientSecret,
      callbackURL: `${config.ingressUrl}/sign-in/callback`,
      state: true,
      customHeaders: { Authorization: generateOauthClientToken() },
    },
    (token, _refreshToken, params, _profile, done) => {
      return done(null, { token, username: params.user_name, authSource: params.auth_source })
    },
  ),
)

// Only trust the Referer header as a same-origin path; it's attacker-controlled
// (e.g. a cross-site link to this endpoint) and could otherwise be used to turn
// the subsequent OAuth login flow into an open redirect via `returnTo`.
export function sameOriginReturnPath(referer: string | undefined, ingressUrl: string): string {
  if (!referer) return '/'
  try {
    const refererUrl = new URL(referer)
    const ingressOrigin = new URL(ingressUrl).origin
    if (refererUrl.origin !== ingressOrigin) return '/'
    return `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`
  } catch {
    return '/'
  }
}

export default function setupAuthentication() {
  const router = Router()
  const tokenVerificationClient = new VerificationClient(config.apis.tokenVerification, logger)

  router.use(passport.initialize())
  router.use(passport.session())
  router.use(flash())

  router.get('/autherror', (_req, res) => {
    res.status(401)
    return res.render('autherror')
  })

  router.get('/sign-in', passport.authenticate('oauth2'))

  router.get('/sign-in/callback', (req, res, next) =>
    passport.authenticate('oauth2', {
      successReturnToOrRedirect: req.session.returnTo || '/',
      failureRedirect: '/autherror',
    })(req, res, next),
  )

  const authUrl = config.apis.hmppsAuth.externalUrl
  const authParameters = `client_id=${config.apis.hmppsAuth.authClientId}&redirect_uri=${config.ingressUrl}`

  router.get('/switch-account', async (req, res, next) => {
    req.session.returnTo = sameOriginReturnPath(req.headers.referer, config.ingressUrl)
    // Revoke the current token in token-verification-api so it can't be reused.
    // Best-effort: a failure here should not block the account switch.
    const { user } = req as AuthenticatedRequest
    if (user?.token) {
      try {
        // TODO - probably should add token deletion/revocation method to this library:
        // https://github.com/ministryofjustice/hmpps-typescript-lib/blob/main/packages/auth-clients/src/main/VerificationClient.ts
        await tokenVerificationClient.delete({ path: '/token/self' }, user.token)
      } catch (err) {
        logger.warn('Failed to revoke token during switch-account: %s', err)
      }
    }
    // Remove this app's user token from the session.
    // The session itself is kept alive so that returnTo survives into the new OAuth flow.
    req.logout(err => {
      if (err) return next(err)
      return res.redirect('/sign-in')
    })
  })

  router.use('/sign-out', (req, res, next) => {
    const authSignOutUrl = `${authUrl}/sign-out?${authParameters}`
    if (req.user) {
      req.logout(err => {
        if (err) return next(err)
        return req.session.destroy(() => res.redirect(authSignOutUrl))
      })
    } else res.redirect(authSignOutUrl)
  })

  router.use('/account-details', (_req, res) => {
    res.redirect(`${authUrl}/account-details?${authParameters}`)
  })

  router.use(async (req, res, next) => {
    if (req.isAuthenticated() && (await tokenVerificationClient.verifyToken(req as unknown as AuthenticatedRequest))) {
      return next()
    }
    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  })

  router.use((req, res, next) => {
    res.locals.user = req.user as HmppsUser
    next()
  })

  return router
}
