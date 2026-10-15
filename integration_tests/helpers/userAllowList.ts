import { Page } from '@playwright/test'
import { UserAllowlistDetail } from 'manageUsersApiClient'
import AuthRole from '../../server/interfaces/authRole'
import { login } from '../testUtils'
import HomePage from '../pages/homePage'
import manageUsersApi from '../mockApis/manageUsersApi'
import SearchAllowListPage from '../pages/userAllowList/searchPage'
import ViewAllowListPage from '../pages/userAllowList/viewPage'
import EditAllowListPage from '../pages/userAllowList/editPage'

const defaultUser = (): UserAllowlistDetail => ({
  id: 'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
  username: 'TUSER_GEN',
  email: 'test.user@justice.gov.uk',
  firstName: 'Test',
  lastName: 'User',
  reason: 'For testing purposes',
  accessPeriod: 'ONE_MONTH',
  createdOn: '2024-03-19T04:39:08',
  allowlistEndDate: '2027-04-19',
  lastUpdated: '2024-03-19T04:39:08',
  lastUpdatedBy: 'ADMIN',
  userType: 'DIGITAL',
  approver: 'Sharlotte Muirhead',
})

export const gotoSearchPage = async (
  page: Page,
  {
    roles = [AuthRole.MANAGE_USER_ALLOW_LIST],
    totalElements = 1,
    size = 20,
    content,
  }: {
    roles?: AuthRole[]
    totalElements?: number
    size?: number
    content?: UserAllowlistDetail[]
  } = {},
) => {
  await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  await login(page, { roles })
  const homePage = await HomePage.verifyOnPage(page)
  await manageUsersApi.stubSearchAllowlistUsers({ totalElements, size, content })
  await homePage.selectTile('search_user_allow_list')
  return SearchAllowListPage.verifyOnPage(page)
}

export const editUser = async (
  page: Page,
  {
    roles = [AuthRole.MANAGE_USER_ALLOW_LIST],
    user,
  }: {
    roles?: AuthRole[]
    user?: Partial<UserAllowlistDetail>
  } = {},
) => {
  const allowlistUser = { ...defaultUser(), ...user }
  const searchPage = await gotoSearchPage(page, { roles, content: [allowlistUser] })
  await manageUsersApi.stubGetAllowlistUser(allowlistUser)
  await manageUsersApi.stubUpdateAllowlistUserAccess(allowlistUser.id)
  await searchPage.userDetailsLink(allowlistUser.username).click()
  const viewPage = await ViewAllowListPage.verifyOnPage(page, `${allowlistUser.firstName} ${allowlistUser.lastName}`)
  await viewPage.editButton.click()
  return EditAllowListPage.verifyOnPage(page, `${allowlistUser.firstName} ${allowlistUser.lastName}`)
}

export const defaultAllowlistUser = defaultUser
