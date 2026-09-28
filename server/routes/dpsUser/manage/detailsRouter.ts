import { Router } from 'express'
import { PrisonCaseload, PrisonUserDetails, RoleDetail, UserRole } from 'manageUsersApiClient'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import setupRestrictedRoles from '../../../middleware/route/restrictedRolesMiddleware'
import paths from '../../paths'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import AuthRole from '../../../interfaces/authRole'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import { dpsUserRootUrlProvider } from './common'
import { userDetailsGetHandler, UserGroupWithShowRemove } from '../../userCommon/userDetailsHandlers'
import { Page } from '../../audit'

const getPageData = async (
  hmppsUser: HmppsUser,
  username: string,
  { dpsUserService, userService }: Services,
): Promise<
  [PrisonUserDetails, UserRole[], UserGroupWithShowRemove[] | undefined, PrisonCaseload[] | undefined, boolean]
> => {
  const { token } = hmppsUser
  const [user, roles, email, caseloads] = await Promise.all([
    dpsUserService.getDpsUser(token, username, true),
    dpsUserService.getRoles(token, username),
    userService.getUserEmail(token, username),
    dpsUserService.getUserCaseloads(token, username),
  ])
  const staffUser = {
    ...user,
    email: user.primaryEmail,
    emailToVerify: email.email,
    verified: email.verified,
    activeCaseload: roles.activeCaseload,
  }
  return [
    staffUser,
    roles.dpsRoles.map((r: RoleDetail) => ({ roleCode: r.code, roleName: r.name })),
    undefined,
    caseloads.caseloads,
    !staffUser.verified && staffUser.emailToVerify && staffUser.emailToVerify !== staffUser.email,
  ]
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  router.get(
    '/',
    setupRestrictedRoles<UserParam>(services),
    userDetailsGetHandler(
      services,
      Page.VIEW_DPS_USER,
      dpsUserRootUrlProvider,
      'Search for a DPS user',
      paths.dpsUser.search.pattern,
      getPageData,
      false,
      false,
    ),
  )

  return router
}
