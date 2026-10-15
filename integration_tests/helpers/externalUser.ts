import { Page } from '@playwright/test'
import { ExternalUser, UserGroup, UserRole } from 'manageUsersApiClient'
import AuthRole from '../../server/interfaces/authRole'
import { login } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import SearchExternalUserPage from '../pages/externalUser/searchPage'
import UserPage from '../pages/userPage'

const defaultUserId = '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f'

export const defaultSearchUser = (): ExternalUser => ({
  userId: defaultUserId,
  username: 'AUTH_ADM',
  email: 'auth_test2@digital.justice.gov.uk',
  enabled: true,
  locked: false,
  verified: true,
  firstName: 'Auth',
  lastName: 'Adm',
  active: true,
  lastLoggedIn: '2023-10-15T10:01:58.614221',
})

export const gotoSearchPage = async (
  page: Page,
  {
    roles = [AuthRole.MAINTAIN_OAUTH_USERS],
    totalElements = 1,
    size = 20,
    content,
  }: {
    roles?: AuthRole[]
    totalElements?: number
    size?: number
    content?: ExternalUser[]
  } = {},
) => {
  await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  await login(page, { roles })
  const homePage = await HomePage.verifyOnPage(page)
  await manageUsersApi.stubAssignableGroups()
  await manageUsersApi.stubSearchableRoles()
  await manageUsersApi.stubSearchExternalUsers({ totalElements, size, content })
  await homePage.selectTile('maintain_auth_users_link')
  return SearchExternalUserPage.verifyOnPage(page)
}

export const editUser = async (
  page: Page,
  {
    roles = [AuthRole.MAINTAIN_OAUTH_USERS],
    searchContent,
    userRoles,
    userGroups,
    assignableGroups,
    user,
  }: {
    roles?: AuthRole[]
    searchContent?: ExternalUser[]
    userRoles?: UserRole[]
    userGroups?: UserGroup[]
    assignableGroups?: UserGroup[]
    user?: Partial<ExternalUser>
  } = {},
) => {
  const searchUsers = searchContent ?? [defaultSearchUser()]
  const staff = { ...defaultSearchUser(), ...searchUsers[0], ...user }
  const searchPage = await gotoSearchPage(page, { roles, content: searchUsers })

  await manageUsersApi.stubGetExternalUser(staff)
  await manageUsersApi.stubExternalUserRoles(userRoles)
  await manageUsersApi.stubUserGroups(userGroups)
  await manageUsersApi.stubAssignableGroups(assignableGroups)

  await searchPage.userDetailsLink(staff.username).click()
  return UserPage.verifyOnPage(page, `${staff.firstName} ${staff.lastName}`)
}
