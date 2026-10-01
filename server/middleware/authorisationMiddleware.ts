import type { RequestHandler } from 'express'
import { toSameOriginPath } from '../utils/utils'

export default function authorisationMiddleware(): RequestHandler {
  return (req, res, next) => {
    if (!res.locals?.user?.token) {
      req.session.returnTo = toSameOriginPath(req.originalUrl)
      return res.redirect('/sign-in')
    }
    return next()
  }
}
