import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'
import hmppsAuth from '../mockApis/hmppsAuth'
import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'

test.describe('Footer', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Acceptable use statement link navigates to the auth terms page', async ({ page }) => {
    await hmppsAuth.stubTermsPage()
    await login(page)
    const homePage = await HomePage.verifyOnPage(page)

    const link = homePage.acceptableUseLink
    await expect(link).toHaveAttribute('href', '/terms')
    await link.click()

    await expect(page).toHaveURL(/\/auth\/terms/)
    await expect(page.getByRole('heading')).toHaveText('Acceptable use statement')
  })
})
