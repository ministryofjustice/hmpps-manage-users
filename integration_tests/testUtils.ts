import { expect, Locator, Page } from '@playwright/test'
import { UserCaseloadDetail } from 'manageUsersApiClient'
import tokenVerification from './mockApis/tokenVerification'
import hmppsAuth, { type UserToken } from './mockApis/hmppsAuth'
import { resetStubs } from './mockApis/wiremock'
import { HttpStatusCode } from '../server/utils/utils'
import manageUsersApi from './mockApis/manageUsersApi'

export { resetStubs }

const DEFAULT_ROLES = ['ROLE_SOME_REQUIRED_ROLE']

export const attemptHmppsAuthLogin = async (page: Page) => {
  await page.goto('/')
  page.locator('h1', { hasText: 'Sign in' })
  const url = await hmppsAuth.getSignInUrl()
  return page.goto(url)
}

export const login = async (
  page: Page,
  {
    name,
    roles = DEFAULT_ROLES,
    active = true,
    authSource = 'nomis',
    userCaseloadDetail,
  }: UserToken & { active?: boolean; userCaseloadDetail?: UserCaseloadDetail } = {},
) => {
  const requests = [
    hmppsAuth.favicon(),
    hmppsAuth.stubSignInPage(),
    hmppsAuth.stubSignOutPage(),
    hmppsAuth.token({ name, roles, authSource }),
    tokenVerification.stubVerifyToken(active),
  ]
  if (authSource === 'nomis') {
    requests.push(manageUsersApi.stubDpsUserCaseloads({ username: 'USER1', userCaseloadDetail }))
  }
  await Promise.all(requests)
  return attemptHmppsAuthLogin(page)
}

export const fillAutocompleteSelect = async (selectLocator: Locator, value: string) => {
  await selectLocator.fill(value)
  await selectLocator.press('Enter')
}

export const attemptPostWithoutCsrf = async (page: Page, url: string) => {
  const response = await page.request.post(url, {
    data: {},
    failOnStatusCode: false,
    maxRedirects: 0,
  })
  expect(response.status()).toBe(HttpStatusCode.FOUND)
  expect(response.headers().location).toEqual('/sign-out')
}
