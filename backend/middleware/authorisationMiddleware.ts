import jwtDecode from 'jwt-decode'
import type { RequestHandler } from 'express'
import logger from '../log'

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.user?.access_token) {
      const { authorities: roles = [] } = jwtDecode(res.locals.user.access_token) as { authorities?: string[] }

      if (authorisedRoles.length && !roles.some((role) => authorisedRoles.includes(role))) {
        logger.error('User is not authorised to access this')
        return res.redirect('/authError')
      }

      if (req.originalUrl.endsWith('/select-caseloads') && !roles.includes('ROLE_MAINTAIN_ACCESS_ROLES_ADMIN')) {
        logger.error('User is not authorised to access assign caseload page')
        return res.redirect('/authError')
      }
      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  }
}
