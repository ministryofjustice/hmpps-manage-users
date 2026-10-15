import { expect, test } from '@playwright/test'
import { getMatchingRequests } from '../mockApis/wiremock'
import tokenVerification from '../mockApis/tokenVerification'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'

test.describe('Switch account', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('User can switch account and is sent back to sign in', async ({ page }) => {
    await login(page)
    await tokenVerification.stubRevokeToken()

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.accountMenuButton.click()
    await page.getByTestId('switchAccount').click()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })

  test('Switching account revokes the current token', async ({ page }) => {
    await login(page)
    await tokenVerification.stubRevokeToken()

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.accountMenuButton.click()
    await page.getByTestId('switchAccount').click()

    await expect(page.getByRole('heading')).toHaveText('Sign in')

    const revokeRequests = await getMatchingRequests({
      method: 'DELETE',
      urlPattern: '/verification/token/self',
    })
    expect(revokeRequests).toHaveLength(1)
  })

  test('Switching account still succeeds if token revocation fails', async ({ page }) => {
    await login(page)
    // deliberately don't stub DELETE /verification/token/self - wiremock will 404 it,
    // exercising the best-effort try/catch around the revoke call

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.accountMenuButton.click()
    await page.getByTestId('switchAccount').click()

    await expect(page.getByRole('heading')).toHaveText('Sign in')
  })
})
