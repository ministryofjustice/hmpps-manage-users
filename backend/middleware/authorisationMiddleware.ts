import jwtDecode from 'jwt-decode'
import type { RequestHandler } from 'express'
import logger from '../log'

enum AuthRole {
  CREATE_USER = 'ROLE_CREATE_USER',
  MAINTAIN_ACCESS_ROLES_ADMIN = 'ROLE_MAINTAIN_ACCESS_ROLES_ADMIN',
  MAINTAIN_OAUTH_USERS = 'ROLE_MAINTAIN_OAUTH_USERS',
  GROUP_MANAGER = 'ROLE_AUTH_GROUP_MANAGER',
}

const authorisationMap = {
  '/select-caseloads': AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN,
  '/create-dps-user': AuthRole.CREATE_USER,
  '/create-group': AuthRole.MAINTAIN_OAUTH_USERS,
  '/create-child-group': AuthRole.MAINTAIN_OAUTH_USERS,
  '/create-user': AuthRole.CREATE_USER,
}

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.access_token) {
      const { authorities: roles = [] } = jwtDecode(res.locals.access_token) as { authorities?: string[] }

      try {
        if (authorisedRoles.length && !roles.some((role) => authorisedRoles.includes(role))) {
          throw Error(`User is not authorised to access manage-users`)
        }

        Object.entries(authorisationMap).forEach(([urlMatch, authorisedRole]) => {
          if (req.originalUrl.endsWith(urlMatch) && !roles.includes(authorisedRole)) {
            throw Error(`User is not authorised to access ${urlMatch} page`)
          }
        })
      } catch (e) {
        logger.error(e.message)
        return res.redirect('/authError')
      }

      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  }
}
