import { Router } from 'express'
import { ExternalUser, UserRole } from 'manageUsersApiClient'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import paths from '../../paths'
import { validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { Form, selectRolesGetHandler, selectRolesPostHandler, validate } from '../../userCommon/selectRolesHandlers'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import { externalUserDetailsUrlProvider } from './common'

const getPageData = async (
  user: HmppsUser,
  username: string,
  services: Services,
): Promise<[ExternalUser, UserRole[], string]> => {
  const { externalUserService } = services
  const { token } = user
  return Promise.all([
    externalUserService.getUser(token, username),
    externalUserService.getAssignableRoles(user, username),
    '',
  ])
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get(
    '/',
    selectRolesGetHandler(
      services,
      'Search for an external user',
      paths.externalUser.search.pattern,
      externalUserDetailsUrlProvider,
      getPageData,
      staffUser => staffUser.enabled,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req =>
      paths.externalUser.manage.selectRoles({ userId: req.params.userId }),
    ),
    selectRolesPostHandler(
      services,
      ({ externalUserService }, token, userId, roles) => externalUserService.addRoles(token, userId, roles),
      externalUserDetailsUrlProvider,
    ),
  )

  return router
}
