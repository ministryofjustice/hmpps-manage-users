import { Page } from '@playwright/test'
import { PrisonUserGroupDetail, UserCaseloadDetail, RoleDetail } from 'manageUsersApiClient'
import AuthRole from '../../server/interfaces/authRole'
import { login } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import SearchPage from '../pages/dpsUser/searchPage'
import UserPage from '../pages/userPage'

export const gotoSearchPage = async (
  page: Page,
  {
    roles,
    totalElements = 21,
    size = 10,
  }: {
    roles: AuthRole[]
    totalElements?: number
    size?: number
  },
) => {
  await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  await login(page, { roles })

  const homePage = await HomePage.verifyOnPage(page)
  await manageUsersApi.stubGetCaseloads()
  await manageUsersApi.stubDpsRoles(roles.includes(AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN) ? 'DPS_ADM' : 'DPS_LSA')
  await manageUsersApi.stubSearchDpsUsers({ totalElements, size })
  await homePage.selectTile('search_with_filter_dps_users')
  return SearchPage.verifyOnPage(page)
}

export const editUser = async (
  page: Page,
  {
    roles,
    userCaseloads,
    isLocalAdmin = false,
    administratorOfUserGroups,
    email = 'ITAG_USER@gov.uk',
    emailVerified,
    emailToVerify,
    dpsRoles,
    active = true,
    enabled = true,
    accountStatus = 'OPEN',
  }: {
    roles: AuthRole[]
    userCaseloads?: UserCaseloadDetail
    isLocalAdmin?: boolean
    administratorOfUserGroups?: PrisonUserGroupDetail[]
    email?: string
    emailVerified?: boolean
    emailToVerify?: string
    dpsRoles?: RoleDetail[]
    active?: boolean
    enabled?: boolean
    accountStatus?: string
  },
) => {
  const searchPage = await gotoSearchPage(page, { roles })
  await manageUsersApi.stubRestrictedRolesMiddleware({ isLocalAdmin })
  await manageUsersApi.stubSyncDpsEmail()
  await manageUsersApi.stubGetDpsUser({ administratorOfUserGroups, email, active, enabled, accountStatus })
  await manageUsersApi.stubDpsUserRoles({ dpsRoles })
  await manageUsersApi.stubDpsUserCaseloads({ userCaseloadDetail: userCaseloads })
  await manageUsersApi.stubEmail({ email: emailToVerify || email, verified: emailVerified })
  await searchPage.userDetailsLink('ITAG_USER5').click()
  return UserPage.verifyOnPage(page, 'Itag User')
}
