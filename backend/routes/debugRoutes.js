// SECURITY WARNING: This file registers unauthenticated debug routes.
// These routes are only registered when NODE_ENV !== 'production' (i.e. locally).
// They are registered BEFORE passport/requireSignInMiddleware, meaning they are
// accessible to ANY request with no authentication required.
// They expose sensitive data for ALL active sessions including JWT access tokens,
// session IDs, CSRF tokens, and cookie signatures. Do not enable in any shared environment.
//
// NOTE: cdnjs.cloudflare.com is added to scriptSrc/styleSrc in setUpWebSecurity.ts
// to support highlight.js on this page. This CSP change is gated behind !config.app.production
// so it does not apply in deployed environments.
const { jwtDecode } = require('jwt-decode')
const { getAccessToken } = require('../contextProperties')
const setupWebSession = require('../middleware/setupWebSession')
const config = require('../config').default

const configureDebugRoutes = (app) => {
  app.get('/debug/session', (req, res) => {
    const rawToken =
      getAccessToken(res.locals) ||
      (req.session.passport && req.session.passport.user && req.session.passport.user.access_token)
    const decodedToken = rawToken ? jwtDecode(rawToken) : null
    const locals = {
      ...res.locals,
      access_token: rawToken ? '[redacted - see decodedToken above]' : null,
      refresh_token: res.locals.refresh_token ? '[redacted]' : null,
    }

    const cookieName = config.hmppsCookie.name
    const cookies = req.headers.cookie || ''
    const rawCookie =
      cookies
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${cookieName}=`)) || null
    const rawCookieValue = rawCookie ? rawCookie.slice(cookieName.length + 1) : null
    // raw format is s:SESSION_ID.SIGNATURE (URL-encoded)
    const decodedCookieValue = rawCookieValue ? decodeURIComponent(rawCookieValue) : null
    const signatureSep = decodedCookieValue ? decodedCookieValue.indexOf('.') : -1
    const signature = signatureSep !== -1 ? decodedCookieValue.slice(signatureSep + 1) : null
    const sessionCookie = {
      name: cookieName,
      raw: rawCookieValue,
      decoded: {
        sessionId: req.sessionID,
        signature,
      },
    }

    setupWebSession.sessionStoreRef.store.all((err, allSessions) => {
      // SECURITY WARNING: allSessions contains raw passport.user.access_token and refresh_token
      // for every logged-in user. These are NOT redacted. If REDIS_HOST points to a shared
      // Redis instance, this will expose real users' tokens to anyone who can reach this endpoint.
      res.json({
        decodedToken,
        sessionCookie,
        currentSession: req.session,
        locals,
        usingRedis: config.redis.enabled,
        allSessions: err ? { error: err.message } : allSessions,
      })
    })
  })

  app.get('/debug/session/view', (req, res) => {
    res.render('debug/session')
  })
}

module.exports = { configureDebugRoutes }
