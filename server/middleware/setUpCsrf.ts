import { Router, RequestHandler } from 'express'
import { csrfSync } from 'csrf-sync'

const testMode = process.env.NODE_ENV === 'test'

const {
  csrfSynchronisedProtection, // This is the default CSRF protection middleware.
} = csrfSync({
  // By default, csrf-sync uses x-csrf-token header, but we use the token in forms and send it in the request body, so change getTokenFromRequest so it grabs from there
  getTokenFromRequest: req => {
    // eslint-disable-next-line no-underscore-dangle
    return req.body?._csrf
  },
})

// Exported so that routes which need to parse a multipart body (e.g. file uploads via multer)
// before the CSRF token is available can apply CSRF protection explicitly after their own
// body-parsing middleware, rather than relying on the global middleware set up below.
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (testMode) {
    next()
    return
  }
  csrfSynchronisedProtection(req, res, next)
}

export default function setUpCsrf(): Router {
  const router = Router({ mergeParams: true })

  // CSRF protection
  router.use((req, res, next) => {
    // Multipart/form-data request bodies (e.g. file uploads) are not parsed by the global
    // body parser, so the CSRF token can't be read from req.body yet at this point. Skip
    // global protection for these requests - the owning route applies it explicitly after
    // its own body-parsing (e.g. multer) middleware instead.
    if (req.is('multipart/form-data')) {
      next()
      return
    }
    csrfProtection(req, res, next)
  })

  router.use((req, res, next) => {
    if (typeof req.csrfToken === 'function') {
      res.locals.csrfToken = req.csrfToken()
    }
    next()
  })

  return router
}
