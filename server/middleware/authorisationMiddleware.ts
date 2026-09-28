import type { RequestHandler } from 'express'

export default function authorisationMiddleware(): RequestHandler {
  return (req, res, next) => {
    if (!res.locals?.user?.token) {
      req.session.returnTo = req.originalUrl
      return res.redirect('/sign-in')
    }
    return next()
  }
}
