import type { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../log'

enum AuthRole {
  CREATE_USER = 'ROLE_CREATE_USER',
  MAINTAIN_ACCESS_ROLES_ADMIN = 'ROLE_MAINTAIN_ACCESS_ROLES_ADMIN',
  MAINTAIN_OAUTH_USERS = 'ROLE_MAINTAIN_OAUTH_USERS',
  GROUP_MANAGER = 'ROLE_AUTH_GROUP_MANAGER',
  ROLES_ADMIN = 'ROLE_ROLES_ADMIN',
  MAINTAIN_EMAIL_DOMAINS = 'ROLE_MAINTAIN_EMAIL_DOMAINS',
  CONTRACT_MANAGER_VIEW_GROUP = 'ROLE_CONTRACT_MANAGER_VIEW_GROUP',
}

const authorisationMap = {
  '/select-caseloads': [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
  '/create-dps-user': [AuthRole.CREATE_USER],
  '/create-linked-dps-user': [AuthRole.CREATE_USER],
  '/create-group': [AuthRole.MAINTAIN_OAUTH_USERS],
  '/create-child-group': [AuthRole.MAINTAIN_OAUTH_USERS],
  '/create-user': [AuthRole.CREATE_USER],
  '/delete/children/none': [AuthRole.MAINTAIN_OAUTH_USERS],
  '/create-external-user': [AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.GROUP_MANAGER],
  '/create-role': [AuthRole.ROLES_ADMIN],
  '/email-domains': [AuthRole.MAINTAIN_EMAIL_DOMAINS],
  '/create-email-domain': [AuthRole.MAINTAIN_EMAIL_DOMAINS],
  '/delete-email-domain': [AuthRole.MAINTAIN_EMAIL_DOMAINS],
  '/crs-group-selection': [AuthRole.CONTRACT_MANAGER_VIEW_GROUP],
}

export default function authorisationMiddleware(authorisedRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.access_token) {
      const { authorities: roles = [] } = jwtDecode(res.locals.access_token) as { authorities?: string[] }

      try {
        if (authorisedRoles.length && !roles.some((role) => authorisedRoles.includes(role))) {
          throw Error(`User is not authorised to access manage-users`)
        }

        Object.entries(authorisationMap).forEach(([urlMatch, authorisationMapRoles]) => {
          if (req.originalUrl.includes(urlMatch)) {
            const accessAllowed = authorisationMapRoles.filter((authorisedRole) => roles.includes(authorisedRole))
            if (accessAllowed.length === 0) {
              throw Error(`User is not authorised to access ${urlMatch} page`)
            }
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
