import { expect, test } from '@playwright/test'
import hmppsAuth from '../mockApis/hmppsAuth'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'

test.describe('SignIn', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Unauthenticated user directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Unauthenticated user navigating to sign in page directed to auth', async ({ page }) => {
    await hmppsAuth.stubSignInPage()
    await page.goto('/sign-in')

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User name visible in header', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.usersName).toHaveText('A. Testuser')
  })

  test('Phase banner visible in header', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.phaseBanner).toHaveText('dev')
  })

  test('Active location (caseload) visible in header', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.activeLocation).toHaveText('Moorland')
  })

  test('Active location (caseload) not visible in header if not nomis auth source', async ({ page }) => {
    await login(page, { authSource: 'delius' })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.activeLocation).not.toBeVisible()
  })

  test('Change location link visible in header', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.changeLocationLink).toBeVisible()
  })

  test('Change location link not visible in header if not nomis auth source', async ({ page }) => {
    await login(page, { authSource: 'delius' })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.changeLocationLink).not.toBeVisible()
  })

  test('Change location link not visible in header if only one caseload, active location still visible', async ({
    page,
  }) => {
    await login(page, {
      userCaseloadDetail: {
        username: 'USER1',
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
        caseloads: [
          {
            id: 'MDI',
            name: 'Moorland',
          },
        ],
      },
    })

    const homePage = await HomePage.verifyOnPage(page)

    await expect(homePage.changeLocationLink).not.toBeVisible()
    await expect(homePage.activeLocation).toHaveText('Moorland')
  })

  test('User can sign out', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.signOut()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('User can manage their details', async ({ page }) => {
    await login(page, { name: 'A TestUser' })

    await hmppsAuth.stubManageDetailsPage()

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.clickManageUserDetails()

    await expect(page.getByRole('heading')).toHaveText('Your account details')
  })

  test('Account menu opens and closes', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)
    const menu = page.locator('#cdps-header__menu--user')

    await expect(homePage.accountMenuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeHidden()

    await homePage.accountMenuButton.click()

    await expect(homePage.accountMenuButton).toHaveAttribute('aria-expanded', 'true')
    await expect(menu).toBeVisible()
    await expect(menu.getByTestId('manageDetails')).toBeVisible()
    await expect(menu.getByTestId('switchAccount')).toBeVisible()
    await expect(menu.getByTestId('signOut')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(homePage.accountMenuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menu).toBeHidden()
  })

  test('Token verification failure takes user to sign in page', async ({ page }) => {
    await login(page, { active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Token verification failure clears user session', async ({ page }) => {
    await login(page, { name: 'A TestUser', active: false })

    await expect(page.getByRole('heading')).toHaveText('Sign in')

    await login(page, { name: 'Some OtherTestUser', active: true })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.usersName).toHaveText('S. Othertestuser')
  })
})
