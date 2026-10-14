import { expect, Page, test } from '@playwright/test'

import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import SelectUserTypePage from '../../pages/dpsUser/selectUserTypePage'
import ExistingAccountOptionPage from '../../pages/dpsUser/existingAccountOptionPage'
import paths from '../../../server/routes/paths'
import CreatePage from '../../pages/dpsUser/createPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthErrorPage from '../../pages/authErrorPage'
import { UserType, userTypeDisplay, UserTypeKey } from '../../../server/presentation/userType'
import AuthRole from '../../../server/interfaces/authRole'

const gotoExistingAccountOptionPage = async (page: Page, userType: UserTypeKey) => {
  await login(page, { roles: [AuthRole.CREATE_USER] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_dps_user_link')
  const selectUserTypePage = await SelectUserTypePage.verifyOnPage(page)
  await selectUserTypePage.radioButton(userTypeDisplay(userType)).click()
  await selectUserTypePage.submit.click()
  return ExistingAccountOptionPage.verifyOnPage(page, userType)
}

test.describe('Existing Account Option', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show yes and no options', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_ADM')
    await expect(existingAccountOptionPage.radioButton('Yes')).not.toBeChecked()
    await expect(existingAccountOptionPage.radioButton('No')).not.toBeChecked()
  })

  test('Should show title for a central admin', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_ADM')
    await expect(existingAccountOptionPage.header).toHaveText(`Create a DPS ${UserType.DPS_ADM} user`)
  })

  test('Should show title for a general user', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_GEN')
    await expect(existingAccountOptionPage.header).toHaveText(`Create a DPS ${UserType.DPS_GEN} user`)
  })

  test('Should show title for an lsa admin', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_LSA')
    await expect(existingAccountOptionPage.header).toHaveText(`Create a DPS ${UserType.DPS_LSA} user`)
  })

  test('Should show error if nothing selected', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_ADM')
    await existingAccountOptionPage.submit.click()
    await expect(existingAccountOptionPage.errorSummary).toHaveText(
      'There is a problem Select if user has an existing account',
    )
  })

  test('Should go back to user type selection if no user type', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await HomePage.verifyOnPage(page)
    await page.goto(paths.dpsUser.createUserOptions.pattern)
    await SelectUserTypePage.verifyOnPage(page)
  })

  test('Should go back to the home page if cancelled', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_ADM')
    await existingAccountOptionPage.radioButton('Yes').click()
    await existingAccountOptionPage.cancel.click()
    await HomePage.verifyOnPage(page)
  })

  test('Should go to create dps admin user page if no existing account selected', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_ADM')
    await manageUsersApi.stubGetCaseloads()
    await existingAccountOptionPage.radioButton('No').click()
    await existingAccountOptionPage.submit.click()
    await CreatePage.verifyOnPage(page, 'DPS_ADM')
  })

  test('Should go to create dps general user page if no existing account selected', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_GEN')
    await manageUsersApi.stubGetCaseloads()
    await existingAccountOptionPage.radioButton('No').click()
    await existingAccountOptionPage.submit.click()
    await CreatePage.verifyOnPage(page, 'DPS_GEN')
  })

  test('Should go to create dps LSA user page if no existing account selected', async ({ page }) => {
    const existingAccountOptionPage = await gotoExistingAccountOptionPage(page, 'DPS_LSA')
    await manageUsersApi.stubGetCaseloads()
    await existingAccountOptionPage.radioButton('No').click()
    await existingAccountOptionPage.submit.click()
    await CreatePage.verifyOnPage(page, 'DPS_LSA')
  })

  test('Should fail attempting to choose existing account if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CREATE_USER'] })

    await page.goto(paths.dpsUser.createUserOptions.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to choose existing account if has other manage users role', async ({ page }) => {
    await login(page, { roles: ['ROLE_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.dpsUser.createUserOptions.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
