import { Page } from '@playwright/test'
import { Group, UserGroup } from 'manageUsersApiClient'
import { login } from '../testUtils'
import AuthRole from '../../server/interfaces/authRole'
import manageUsersApi from '../mockApis/manageUsersApi'
import HomePage from '../pages/homePage'
import GroupListPage from '../pages/groups/groupListPage'
import GroupDetailsPage from '../pages/groups/groupDetailsPage'

export const gotoListGroups = async (
  page: Page,
  assignableGroups?: UserGroup[],
  roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS],
) => {
  await login(page, { roles })

  await manageUsersApi.stubAssignableGroups(assignableGroups)
  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('manage_groups_link')
  return GroupListPage.verifyOnPage(page)
}

export const gotoGroupDetails = async (
  page: Page,
  assignableGroups?: UserGroup[],
  roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS],
  groupDetails: Group = { groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' },
) => {
  const groupListPage = await gotoListGroups(page, assignableGroups, roles)

  await manageUsersApi.stubGroupDetails(groupDetails)

  await groupListPage.editLink(groupDetails.groupCode).click()
  return GroupDetailsPage.verifyOnPage(page, groupDetails.groupName)
}
