import { expect, test } from '@playwright/test'
import { attemptPostWithoutCsrf, fillAutocompleteSelect, login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import GroupDetailsPage from '../../pages/groups/groupDetailsPage'
import { gotoListGroups } from '../../helpers/groups'

const moreThan10Groups = [...Array(11).keys()].map(i => ({
  groupCode: `TEST_GROUP_${i}`,
  groupName: `Test group ${i}`,
}))

test.describe('List Groups', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should display a message if user has no groups', async ({ page }) => {
    const groupListPage = await gotoListGroups(page, [], [AuthRole.MAINTAIN_OAUTH_USERS])

    await expect(groupListPage.noGroups).toHaveText('You are not a member of any groups.')
    await expect(groupListPage.groupFilter).not.toBeVisible()
    await expect(groupListPage.groupRows).not.toBeVisible()
  })

  test('Should display all groups with hyperlinks if 10 or less', async ({ page }) => {
    const groupListPage = await gotoListGroups(page)

    await expect(groupListPage.noGroups).not.toBeVisible()
    await expect(groupListPage.groupFilter).not.toBeVisible()
    await expect(groupListPage.groupRows).toHaveCount(4)
    await expect(groupListPage.groupRows.nth(0)).toHaveText('SOCU North West')
    await expect(groupListPage.groupRows.nth(1)).toHaveText('PECS Police Force Thames Valley')
    await expect(groupListPage.groupRows.nth(2)).toHaveText('PECS Court Southend Combined Court')
    await expect(groupListPage.groupRows.nth(3)).toHaveText('Site 1 - Group 2')
  })

  test('Should display filter for groups if more than 10', async ({ page }) => {
    const groupListPage = await gotoListGroups(page, moreThan10Groups, [AuthRole.MAINTAIN_OAUTH_USERS])

    await expect(groupListPage.noGroups).not.toBeVisible()
    await expect(groupListPage.groupRows).not.toBeVisible()
    await expect(groupListPage.groupFilter).toBeVisible()
    await fillAutocompleteSelect(groupListPage.groupFilter, 'Test')
    await expect(groupListPage.groupFilter).toHaveValue('Test group 0')
    await fillAutocompleteSelect(groupListPage.groupFilter, '10')
    await expect(groupListPage.groupFilter).toHaveValue('Test group 10')
  })

  test('Should go to the group details via the edit link', async ({ page }) => {
    const groupListPage = await gotoListGroups(page)

    await manageUsersApi.stubGroupDetails({ groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' })

    await groupListPage.editLink('SOC_NORTH_WEST').click()
    await GroupDetailsPage.verifyOnPage(page, 'SOCU North West')
  })

  test('Should go to the group details via filtering and clicking manage button', async ({ page }) => {
    const groupListPage = await gotoListGroups(page, moreThan10Groups, [AuthRole.MAINTAIN_OAUTH_USERS])

    await manageUsersApi.stubGroupDetails(moreThan10Groups[10])

    await fillAutocompleteSelect(groupListPage.groupFilter, '10')
    await groupListPage.manageButton.click()
    await GroupDetailsPage.verifyOnPage(page, 'Test group 10')
  })

  test('Shows an error if the manage button is pressed without filtering a group', async ({ page }) => {
    const groupListPage = await gotoListGroups(page, moreThan10Groups, [AuthRole.MAINTAIN_OAUTH_USERS])

    await groupListPage.manageButton.click()
    await expect(groupListPage.errorSummary).toHaveText('There is a problem Enter a group code')
  })

  test('Should fail attempting to list groups if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_OAUTH_USERS'] })

    await page.goto(paths.groups.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to list groups if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.groups.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

    await attemptPostWithoutCsrf(page, paths.groups.list.pattern)
  })
})
