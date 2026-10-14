import { Router } from 'express'
import { ExternalUser, PrisonCaseload, UserGroup, UserRole } from 'manageUsersApiClient'
import { Services } from '../../../services'
import paths from '../../paths'
import AuthRole from '../../../interfaces/authRole'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import { userDetailsGetHandler, UserGroupWithShowRemove } from '../../userCommon/userDetailsHandlers'
import { hasRole, HmppsUser } from '../../../interfaces/hmppsUser'
import { externalUserRootUrlProvider } from './common'
import { Page } from '../../audit'

const getPageData = async (
  hmppsUser: HmppsUser,
  userId: string,
  services: Services,
): Promise<
  [ExternalUser, UserRole[], UserGroupWithShowRemove[] | undefined, PrisonCaseload[] | undefined, boolean]
> => {
  const { externalUserService } = services
  const { token } = hmppsUser
  const hasMaintainOAuthUsers = hasRole(hmppsUser, AuthRole.MAINTAIN_OAUTH_USERS)
  const [user, roles, groups, assignableGroups] = await Promise.all([
    externalUserService.getUser(token, userId),
    externalUserService.getUserRoles(token, userId),
    externalUserService.getUserGroups(token, userId),
    hasMaintainOAuthUsers ? Promise.resolve<UserGroup[]>([]) : externalUserService.assignableGroups(token),
  ])

  const assignableGroupCodes = new Set(assignableGroups.map((g: UserGroup) => g.groupCode))
  return [
    user,
    roles,
    (groups as UserGroup[]).map(g => ({
      groupName: g.groupName,
      groupCode: g.groupCode,
      showRemove: hasMaintainOAuthUsers || assignableGroupCodes.has(g.groupCode),
    })),
    undefined,
    false,
  ]
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get(
    '/',
    userDetailsGetHandler(
      services,
      Page.VIEW_EXTERNAL_USER,
      externalUserRootUrlProvider,
      'Search for an external user',
      paths.externalUser.search.pattern,
      getPageData,
      true,
      true,
    ),
  )

  return router
}
