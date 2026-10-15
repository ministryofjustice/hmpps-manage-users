import { Request, RequestHandler } from 'express'
import { PrisonCaseload, UserGroup, UserRole } from 'manageUsersApiClient'
import { CommonUser, UserParam, UserUrlProvider } from './paramTypes'
import { Services } from '../../services'
import { hasRole, HmppsUser } from '../../interfaces/hmppsUser'
import AuthRole from '../../interfaces/authRole'
import { sortAlphabetically } from '../../presentation/caseloads'
import { formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import { Page } from '../audit'

export type UserGroupWithShowRemove = UserGroup & { showRemove: boolean }

type UserDetailsPageDataProvider<UserType> = (
  user: HmppsUser,
  userId: string,
  services: Services,
) => Promise<[UserType, UserRole[], UserGroupWithShowRemove[] | undefined, PrisonCaseload[] | undefined, boolean]>

export const userDetailsGetHandler = <UserType extends CommonUser>(
  services: Services,
  page: Page.VIEW_DPS_USER | Page.VIEW_EXTERNAL_USER,
  staffUrlProvider: UserUrlProvider,
  searchTitle: string,
  searchUrl: string,
  userDetailsPageDataProvider: UserDetailsPageDataProvider<UserType>,
  canAutoEnableDisableUser: boolean,
  showExtraUserDetails: boolean,
): RequestHandler<UserParam> => {
  return async (req: Request<UserParam>, res) => {
    const { userId } = req.params
    const { user } = res.locals
    const { auditService } = services
    await auditService.logPageView(page, {
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })

    const staffUrl = staffUrlProvider(userId)
    const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : searchUrl
    const hasMaintainDpsUsersAdmin = hasRole(user, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN)
    const hasManageDPSUserAccount = hasRole(user, AuthRole.MANAGE_NOMIS_USER_ACCOUNT)

    const restrictedRoles = res.locals?.restrictedRoles ? res.locals.restrictedRoles : []

    const [staffUser, roles, groups, caseloads, displayEmailChangeInProgress] = await userDetailsPageDataProvider(
      user,
      userId,
      services,
    )

    return res.render('pages/userDetails', {
      searchTitle,
      searchUrl,
      searchResultsUrl,
      staff: { ...staffUser, name: `${staffUser.firstName} ${staffUser.lastName}` },
      staffUrl,
      roles,
      caseloads: caseloads?.sort(sortAlphabetically),
      groups,
      hasMaintainDpsUsersAdmin,
      errors: formErrorsFromFlash(req),
      canAutoEnableDisableUser,
      showEnableDisable: canAutoEnableDisableUser || hasManageDPSUserAccount,
      showExtraUserDetails,
      showUsername: staffUser.email !== staffUser.username.toLowerCase(),
      displayEmailChangeInProgress,
      restrictedRoles,
    })
  }
}
