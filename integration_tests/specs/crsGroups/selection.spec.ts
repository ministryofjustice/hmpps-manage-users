import { expect, Page, test } from '@playwright/test'
import fs from 'node:fs'
import { fillAutocompleteSelect, login } from '../../testUtils'
import AuthRole from '../../../server/interfaces/authRole'
import HomePage from '../../pages/homePage'
import { resetStubs } from '../../mockApis/wiremock'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import CrsGroupSelectionPage from '../../pages/crsGroups/crsGroupSelectionPage'
import manageUsersApi from '../../mockApis/manageUsersApi'

const gotoSelectCrsGroup = async (page: Page) => {
  await login(page, { roles: [AuthRole.CONTRACT_MANAGER_VIEW_GROUP] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('view_crs_group_users_link')
  return CrsGroupSelectionPage.verifyOnPage(page)
}

test.describe('CRS Group Selection', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubGetAllCRSGroups({})
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows details when group not selected', async ({ page }) => {
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await expect(crsGroupSelectionPage.groupSelector).toBeVisible()
    await expect(crsGroupSelectionPage.continueButton).toBeVisible()
    await expect(crsGroupSelectionPage.downloadButton).not.toBeVisible()
    await expect(crsGroupSelectionPage.changeGroupLink).not.toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupHeader).not.toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupName).not.toBeVisible()
  })

  test('Shows details when group selected', async ({ page }) => {
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await manageUsersApi.stubGetUsersInCRSGroup({})
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'Wales')
    await crsGroupSelectionPage.continueButton.click()

    await expect(crsGroupSelectionPage.groupSelector).not.toBeVisible()
    await expect(crsGroupSelectionPage.continueButton).not.toBeVisible()
    await expect(crsGroupSelectionPage.downloadButton).toBeVisible()
    await expect(crsGroupSelectionPage.changeGroupLink).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupHeader).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupName).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupName).toHaveText('CRS Accommodation for South Wales')
  })

  test('Shows empty group message when no users in group and does not show download button', async ({ page }) => {
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await manageUsersApi.stubGetUsersInCRSGroup({ users: [] })
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'Wales')
    await crsGroupSelectionPage.continueButton.click()

    await expect(crsGroupSelectionPage.emptyGroupMessage).toHaveText('Your selected group is empty')
    await expect(crsGroupSelectionPage.downloadButton).not.toBeVisible()
    await expect(crsGroupSelectionPage.changeGroupLink).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupHeader).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupName).toBeVisible()
    await expect(crsGroupSelectionPage.selectedGroupName).toHaveText('CRS Accommodation for South Wales')
  })

  test('Can select a different group if the group is not empty', async ({ page }) => {
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await manageUsersApi.stubGetUsersInCRSGroup({})
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'Wales')
    await crsGroupSelectionPage.continueButton.click()

    await expect(crsGroupSelectionPage.continueButton).not.toBeVisible()
    await crsGroupSelectionPage.changeGroupLink.click()
    await expect(crsGroupSelectionPage.continueButton).toBeVisible()

    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'East Midlands')
    await crsGroupSelectionPage.continueButton.click()
  })

  test('Can select a different group if the group is empty', async ({ page }) => {
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await manageUsersApi.stubGetUsersInCRSGroup({ users: [] })
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'Wales')
    await crsGroupSelectionPage.continueButton.click()

    await expect(crsGroupSelectionPage.continueButton).not.toBeVisible()
    await expect(crsGroupSelectionPage.emptyGroupMessage).toBeVisible()
    await crsGroupSelectionPage.changeGroupLink.click()
    await expect(crsGroupSelectionPage.continueButton).toBeVisible()

    await manageUsersApi.stubGetUsersInCRSGroup({})
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'East Midlands')
    await crsGroupSelectionPage.continueButton.click()
    await expect(crsGroupSelectionPage.emptyGroupMessage).not.toBeVisible()
  })

  test('Can download the list of users in a CRS group', async ({ page }) => {
    await manageUsersApi.stubDpsUsersDownload()
    const downloadPromise = page.waitForEvent('download')
    const crsGroupSelectionPage = await gotoSelectCrsGroup(page)

    await manageUsersApi.stubGetUsersInCRSGroup({
      users: [
        {
          userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
          username: 'TUSER_GEN',
          email: 'test.user@justice.gov.uk',
          enabled: true,
          locked: false,
          verified: false,
          firstName: 'Test',
          lastName: 'User',
          lastLoggedIn: '2025-10-15T10:01:58.614221',
          inactiveReason: 'Retired',
        },
        {
          userId: 'b88d91b5-2397-495f-8b02-85bf9f7dc9db',
          username: 'AUTH_ADM',
          email: 'auth_test@justice.gov.uk',
          enabled: false,
          locked: true,
          verified: true,
          firstName: 'Auth',
          lastName: 'Admin',
          lastLoggedIn: '2026-10-15T10:01:58.614221',
        },
      ],
    })
    await fillAutocompleteSelect(crsGroupSelectionPage.groupSelector, 'Wales')
    await crsGroupSelectionPage.continueButton.click()

    await crsGroupSelectionPage.downloadButton.click()
    const path = await downloadPromise.then(dl => dl.path())
    const csvLines = fs.readFileSync(path, 'utf-8').split('\n')
    expect(csvLines.length).toBe(3)
    expect(csvLines[0]).toEqual('"email","enabled","firstName","lastName","lastLoggedIn","inactiveReason"')
    expect(csvLines[1]).toEqual('"test.user@justice.gov.uk",true,"Test","User","2025-10-15T10:01:58.614221","Retired"')
    expect(csvLines[2]).toEqual('"auth_test@justice.gov.uk",false,"Auth","Admin","2026-10-15T10:01:58.614221",')
  })

  test('Shows error if trying to select a CRS group that does not exist via the url', async ({ page }) => {
    await login(page, { roles: [AuthRole.CONTRACT_MANAGER_VIEW_GROUP] })
    await page.goto(`${paths.crsGroups.select.pattern}?group=NOT_A_CRS_GROUP`)

    const crsGroupSelectionPage = await CrsGroupSelectionPage.verifyOnPage(page)
    await expect(crsGroupSelectionPage.errorSummary).toHaveText(
      "There is a problem The group you have tried to access either doesn't exist or you don't have permission to view it - please select one from the dropdown",
    )
  })

  test('Should fail attempting to select crs group if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CONTRACT_MANAGER_VIEW_GROUP'] })

    await page.goto(paths.crsGroups.select.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to select crs group if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.crsGroups.select.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to download crs group users if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CONTRACT_MANAGER_VIEW_GROUP'] })

    await page.goto(paths.crsGroups.download.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to download crs group users if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.crsGroups.download.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
