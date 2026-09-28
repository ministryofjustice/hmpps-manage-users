import { expect, test } from '@playwright/test'
import * as fs from 'node:fs'
import { ExternalUser } from 'manageUsersApiClient'
import { getMatchingRequests, resetStubs } from '../../mockApis/wiremock'
import { defaultSearchUser, gotoSearchPage } from '../../helpers/externalUser'
import AuthRole from '../../../server/interfaces/authRole'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { fillAutocompleteSelect, login } from '../../testUtils'
import AuthErrorPage from '../../pages/authErrorPage'
import paths from '../../../server/routes/paths'

const getExternalUserSearchRequests = async () => {
  return getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/manage-users-api/externalusers/search',
  })
}

const replicateUser = (times: number): ExternalUser[] =>
  [...Array(times).keys()].map(i => ({
    userId: `2e285ccd-dcfd-4497-9e28-d6e8e10a2d${String(i).padStart(3, '0')}`,
    username: `AUTH_ADM${i}`,
    email: `auth_test${i}@digital.justice.gov.uk`,
    enabled: i % 2 === 0,
    locked: i % 3 === 0,
    verified: i % 5 === 0,
    firstName: 'Auth',
    lastName: `Adm${i}`,
    active: i % 2 === 0,
    lastLoggedIn: '2025-10-15T10:01:58.614221',
  }))

test.describe('Search external user', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await expect(searchPage.filter).toBeVisible()
  })

  test('Can add and remove user filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userFilterInput.fill('Andy')
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Andy')).toBeVisible()
    await expect(searchPage.userFilterInput).toHaveValue('Andy')

    await searchPage.filterCategoryLink('Andy').click()
    await expect(searchPage.filterCategoryLink('Andy')).not.toBeVisible()
    await expect(searchPage.userFilterInput).toHaveValue('')
  })

  test('Should display no results message and keep filters visible', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { content: [] })

    await expect(searchPage.noResults).toContainText('No records found')
    await expect(searchPage.statusAllRadio).toBeChecked()
    await expect(searchPage.userFilterInput).toBeVisible()
    await expect(searchPage.groupFilter).toBeVisible()
    await expect(searchPage.roleFilter).toBeVisible()
  })

  test('Can change status filter between all, active and inactive', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await expect(searchPage.statusAllRadio).toBeChecked()

    await searchPage.statusInactiveRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusInactiveRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('Inactive')).toBeVisible()

    await searchPage.statusActiveRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusActiveRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('Active')).toBeVisible()

    await searchPage.statusAllRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusAllRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('All')).not.toBeVisible()
  })

  test('Shows user details in results', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { content: [defaultSearchUser()] })
    await expect(searchPage.userTableCells).toHaveCount(1)
    await expect(searchPage.userTableCells.first()).toContainText('Auth Adm')
    await expect(searchPage.userTableCells.first()).toContainText('AUTH_ADM')
    await expect(searchPage.userTableCells.first()).toContainText('Active')
  })

  test('Trims user filter input', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userFilterInput.fill(' Andy ')
    await searchPage.filterButton.click()
    await expect(searchPage.filterCategoryLink('Andy')).toBeVisible()
    await expect(searchPage.userFilterInput).toHaveValue('Andy')
  })

  test('Displays locked, active and inactive tags correctly', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { content: replicateUser(4) })
    await expect(searchPage.userTableCells.nth(0)).toContainText('Locked')
    await expect(searchPage.userTableCells.nth(0)).toContainText('Active')
    await expect(searchPage.userTableCells.nth(1)).toContainText('Inactive')
    await expect(searchPage.userTableCells.nth(2)).toContainText('Active')
    await expect(searchPage.userTableCells.nth(3)).toContainText('Locked')
    await expect(searchPage.userTableCells.nth(3)).toContainText('Inactive')
  })

  test('Calls external user search api with group filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.filterGroup('SOCU North West')

    const requests = await getExternalUserSearchRequests()
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      groups: { key: 'groups', values: ['SOC_NORTH_WEST'] },
      name: { key: 'name', values: [''] },
      page: { key: 'page', values: ['0'] },
      status: { key: 'status', values: ['ALL'] },
      size: { key: 'size', values: ['20'] },
    })
  })

  test('Calls external user search api with role filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.filterRole('Global Search')

    const requests = await getExternalUserSearchRequests()
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      page: { key: 'page', values: ['0'] },
      name: { key: 'name', values: [''] },
      roles: { key: 'roles', values: ['GLOBAL_SEARCH'] },
      status: { key: 'status', values: ['ALL'] },
      size: { key: 'size', values: ['20'] },
    })
  })

  test('Can click through pages while maintaining filters', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      totalElements: 101,
      size: 20,
      content: replicateUser(20),
    })

    await searchPage.filterAll()
    await expect(searchPage.paginationResults).toContainText('Showing 1 to 20 of 101 total results')
    await searchPage.paginationPageLink(5).click()

    await expect(searchPage.filterCategoryLink('Andy')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Active', true)).toBeVisible()
    await expect(searchPage.filterCategoryLink('PECS Court Southend Combined Court')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Licence Vary')).toBeVisible()

    const requests = await getExternalUserSearchRequests()
    expect(requests.length).toBe(3)
    expect(requests[2].queryParams).toEqual({
      groups: { key: 'groups', values: ['PECS_SOUTBC'] },
      name: { key: 'name', values: ['Andy'] },
      page: { key: 'page', values: ['4'] },
      roles: { key: 'roles', values: ['LICENCE_VARY'] },
      size: { key: 'size', values: ['20'] },
      status: { key: 'status', values: ['ACTIVE'] },
    })
  })

  test('Can download the list of external users', async ({ page }) => {
    await manageUsersApi.stubSearchExternalUsers({ content: replicateUser(21), totalElements: 21 })
    const searchPage = await gotoSearchPage(page, { content: replicateUser(21), totalElements: 21 })
    const downloadPromise = page.waitForEvent('download')

    await searchPage.downloadButton.click()
    const path = await downloadPromise.then(dl => dl.path())
    const csvLines = fs.readFileSync(path, 'utf-8').trim().split('\n')

    expect(csvLines.length).toBe(22)
    expect(csvLines[0]).toContain('"userId"')
    expect(csvLines[0]).toContain('"username"')
    expect(csvLines[0]).toContain('"email"')
    expect(csvLines[0]).toContain('"enabled"')
    expect(csvLines[0]).toContain('"locked"')
    expect(csvLines[0]).toContain('"verified"')
    expect(csvLines[0]).toContain('"firstName"')
    expect(csvLines[0]).toContain('"lastName"')
  })

  test('Does not show download button for group managers', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.AUTH_GROUP_MANAGER] })
    await expect(searchPage.downloadButton).not.toBeVisible()
  })

  test('Should fail attempting to search external users if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_OAUTH_USERS'] })

    await page.goto(paths.externalUser.search.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to search external users with another manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.externalUser.search.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Direct download endpoint requires maintain oauth users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.AUTH_GROUP_MANAGER] })
    await manageUsersApi.stubAssignableGroups()
    await manageUsersApi.stubSearchableRoles()
    await manageUsersApi.stubSearchExternalUsers()
    await page.goto(paths.externalUser.download.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Calls external user search api with no filters', async ({ page }) => {
    await gotoSearchPage(page)

    const requests = await getExternalUserSearchRequests()
    expect(requests.length).toBe(1)
    expect(requests[0].queryParams).toEqual({
      page: { key: 'page', values: ['0'] },
      status: { key: 'status', values: ['ALL'] },
      size: { key: 'size', values: ['20'] },
    })
  })

  test('Can filter by user, status, group and role in one request', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userFilterInput.fill('Andy')
    await searchPage.statusActiveRadio.click()
    await fillAutocompleteSelect(searchPage.groupFilter, 'PECS Court Southend Combined Court')
    await fillAutocompleteSelect(searchPage.roleFilter, 'Licence Vary')
    await searchPage.filterButton.click()

    const requests = await getExternalUserSearchRequests()
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      groups: { key: 'groups', values: ['PECS_SOUTBC'] },
      name: { key: 'name', values: ['Andy'] },
      page: { key: 'page', values: ['0'] },
      roles: { key: 'roles', values: ['LICENCE_VARY'] },
      size: { key: 'size', values: ['20'] },
      status: { key: 'status', values: ['ACTIVE'] },
    })
  })
})
