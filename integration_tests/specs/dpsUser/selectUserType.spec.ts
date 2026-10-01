import { expect, test, Page } from '@playwright/test'

import { login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import SelectUserTypePage from '../../pages/dpsUser/selectUserTypePage'
import ExistingAccountOptionPage from '../../pages/dpsUser/existingAccountOptionPage'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import { UserType } from '../../../server/presentation/userType'
import AuthRole from '../../../server/interfaces/authRole'

const gotoSelectUserTypePage = async (page: Page) => {
  await login(page, { roles: [AuthRole.CREATE_USER] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_dps_user_link')
  return SelectUserTypePage.verifyOnPage(page)
}

test.describe('Select DPS user type', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show all available user types', async ({ page }) => {
    const selectUserTypePage = await gotoSelectUserTypePage(page)
    await expect(selectUserTypePage.radioButton(UserType.DPS_ADM)).not.toBeChecked()
    await expect(selectUserTypePage.radioButton(UserType.DPS_GEN)).not.toBeChecked()
    await expect(selectUserTypePage.radioButton(UserType.DPS_LSA)).not.toBeChecked()
  })

  test('Should show error if nothing selected', async ({ page }) => {
    const selectUserTypePage = await gotoSelectUserTypePage(page)
    await selectUserTypePage.submit.click()
    await expect(selectUserTypePage.errorSummary).toHaveText('There is a problem Select a user type')
  })

  test('Should successfully move to existing account option page if user type selected', async ({ page }) => {
    const selectUserTypePage = await gotoSelectUserTypePage(page)
    await selectUserTypePage.radioButton(UserType.DPS_ADM).click()
    await selectUserTypePage.submit.click()
    await ExistingAccountOptionPage.verifyOnPage(page, 'DPS_ADM')
  })

  test('Should go back to the home page if cancelled', async ({ page }) => {
    const selectUserTypePage = await gotoSelectUserTypePage(page)
    await selectUserTypePage.radioButton(UserType.DPS_ADM).click()
    await selectUserTypePage.cancel.click()
    await HomePage.verifyOnPage(page)
  })

  test('Should fail attempting to select user type if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CREATE_USER'] })

    await page.goto(paths.dpsUser.createUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to select user type if has other manage users role', async ({ page }) => {
    await login(page, { roles: ['ROLE_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.dpsUser.createUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
