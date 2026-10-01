import { Router } from 'express'
import { PrisonUserDetails, Role, RoleDetail, UserRole } from 'manageUsersApiClient'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import paths from '../../paths'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import { validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { Form, selectRolesGetHandler, selectRolesPostHandler, validate } from '../../userCommon/selectRolesHandlers'
import { dpsUserDetailsUrlProvider } from './common'

const getPageData = async (
  user: HmppsUser,
  username: string,
  services: Services,
): Promise<[PrisonUserDetails, UserRole[], string]> => {
  const { dpsUserService, rolesService } = services
  const { token } = user
  return Promise.all([
    dpsUserService.getDpsUser(token, username),
    dpsUserService.getRoles(token, username),
    rolesService.getAssignableRoles(user),
    rolesService.getBannerMessage(token),
  ]).then(([dpsUser, userRoles, allRoles, bannerMessage]) => {
    const userRoleCodes = new Set(userRoles.dpsRoles.map((role: RoleDetail) => role.code))
    return [dpsUser, allRoles.filter((r: Role) => !userRoleCodes.has(r.roleCode)), bannerMessage]
  })
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  router.get(
    '/',
    selectRolesGetHandler(
      services,
      'Search for a DPS user',
      paths.dpsUser.search.pattern,
      dpsUserDetailsUrlProvider,
      getPageData,
      staffUser => staffUser.active,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req =>
      paths.dpsUser.manage.selectRoles({ userId: req.params.userId }),
    ),
    selectRolesPostHandler(
      services,
      ({ dpsUserService }, token, userId, roles) => dpsUserService.addRoles(token, userId, roles),
      dpsUserDetailsUrlProvider,
    ),
  )

  return router
}
