import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import { UserAllowlistDetail } from 'manageUsersApiClient'
import { defaultAllowlistUser, gotoSearchPage } from '../../helpers/userAllowList'
import { login } from '../../testUtils'
import { resetStubs } from '../../mockApis/wiremock'
import AuthErrorPage from '../../pages/authErrorPage'
import ViewAllowListPage from '../../pages/userAllowList/viewPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import paths from '../../../server/routes/paths'

const buildAllowlistUser = (overrides: Partial<UserAllowlistDetail> = {}): UserAllowlistDetail => ({
  ...defaultAllowlistUser(),
  ...overrides,
})

test.describe('Search allow list users', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show a list of users', async ({ page }) => {
    const expiredUser = buildAllowlistUser({
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
      allowlistEndDate: '2020-04-19',
      userType: 'DIGITAL',
    })
    const activeUser = buildAllowlistUser({
      username: 'ZAFIRAHT9YH',
      email: 'litany.storm@justice.gov.uk',
      firstName: 'Litany',
      lastName: 'Storm',
      reason: 'For testing',
      accessPeriod: 'ONE_MONTH',
      allowlistEndDate: '2099-04-19',
      userType: 'GENERAL',
    })

    const searchPage = await gotoSearchPage(page, { content: [expiredUser, activeUser], totalElements: 2 })

    await expect(searchPage.userTableCells).toHaveCount(2)
    await expect(searchPage.userDetailsLink(expiredUser.username)).toContainText('Anastazia Armistead')
    await expect(page.getByTestId(`username-${expiredUser.username}`)).toContainText(`- ${expiredUser.username}`)
    await expect(page.getByTestId(`user-type-${expiredUser.username}`)).toContainText(`- Digital user`)
    await expect(page.getByTestId(`email-${expiredUser.username}`)).toContainText(expiredUser.email)
    await expect(page.getByTestId(`expiry-${expiredUser.username}`)).toContainText('19 April 2020')
    await expect(page.getByTestId(`status-${expiredUser.username}`)).toContainText('Expired')

    await expect(searchPage.userDetailsLink(activeUser.username)).toContainText('Litany Storm')
    await expect(page.getByTestId(`username-${activeUser.username}`)).toContainText(`- ${activeUser.username}`)
    await expect(page.getByTestId(`user-type-${activeUser.username}`)).toContainText(`- General user`)
    await expect(page.getByTestId(`email-${activeUser.username}`)).toContainText(activeUser.email)
    await expect(page.getByTestId(`expiry-${activeUser.username}`)).toContainText('No restriction')
    await expect(page.getByTestId(`status-${activeUser.username}`)).toContainText('Active')
  })

  test('Should click through to a user page from the user name', async ({ page }) => {
    const user = buildAllowlistUser({
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
      allowlistEndDate: '2020-04-19',
    })
    await manageUsersApi.stubGetAllowlistUser(user)

    const searchPage = await gotoSearchPage(page, { content: [user] })
    await searchPage.userDetailsLink(user.username).click()

    await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
  })

  test('Should click through to a user page from view details', async ({ page }) => {
    const user = buildAllowlistUser({
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
      allowlistEndDate: '2020-04-19',
    })
    await manageUsersApi.stubGetAllowlistUser(user)

    const searchPage = await gotoSearchPage(page, { content: [user] })
    await searchPage.viewDetailsLink(user.username).click()

    await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
  })

  test('Should show download button when 20000 or fewer users are found', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { totalElements: 20000 })

    await expect(searchPage.downloadButton).toBeVisible()
  })

  test('Should hide download button when more than 20000 users are found', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { totalElements: 20001 })

    await expect(searchPage.downloadButton).not.toBeVisible()
    await expect(searchPage.downloadLimitExceededMessage).toBeVisible()
  })

  test('Should keep the user filter empty by default', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)

    await expect(searchPage.userFilterInput).toHaveValue('')
  })

  test('Should keep the status filter on All by default', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)

    await expect(searchPage.statusAllRadio).toBeChecked()
  })

  test('Should keep the userType filter on All by default', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)

    await expect(searchPage.userTypeAllRadio).toBeChecked()
  })

  test('Should show an Active filter tag', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.statusActiveRadio.click()
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Active')).toBeVisible()
  })

  test('Should show an Expired filter tag', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.statusExpiredRadio.click()
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Expired')).toBeVisible()
  })

  test('Should show a General user filter tag', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userTypeGeneralRadio.click()
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('General')).toBeVisible()
  })

  test('Should show a Digital user filter tag', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userTypeDigitalRadio.click()
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Digital')).toBeVisible()
  })

  test('Should show a user filter tag', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userFilterInput.fill('Bob')
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Bob')).toBeVisible()
  })

  test('Should show all filter tags together', async ({ page }) => {
    const searchPage = await gotoSearchPage(page)
    await searchPage.userFilterInput.fill('Bob')
    await searchPage.statusActiveRadio.click()
    await searchPage.userTypeGeneralRadio.click()
    await searchPage.filterButton.click()

    await expect(searchPage.filterCategoryLink('Bob')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Active')).toBeVisible()
    await expect(searchPage.filterCategoryLink('General')).toBeVisible()
  })

  test('Should download the CSV results', async ({ page }) => {
    const expiredUser = buildAllowlistUser({
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
      allowlistEndDate: '2020-04-19',
      userType: 'DIGITAL',
    })
    const activeUser = buildAllowlistUser({
      username: 'ZAFIRAHT9YH',
      email: 'litany.storm@justice.gov.uk',
      firstName: 'Litany',
      lastName: 'Storm',
      reason: 'For testing',
      accessPeriod: 'ONE_MONTH',
      allowlistEndDate: '2099-04-19',
      userType: 'GENERAL',
    })

    const downloadPromise = page.waitForEvent('download')
    const searchPage = await gotoSearchPage(page, { content: [expiredUser, activeUser], totalElements: 2 })

    await searchPage.downloadButton.click()
    const path = await downloadPromise.then(dl => dl.path())
    const csvLines = fs.readFileSync(path, 'utf-8').trim().split('\n')

    expect(csvLines).toHaveLength(3)
    expect(csvLines[0]).toEqual(
      '"username","firstName","lastName","email","reason","allowlistEndDate","createdOn","lastUpdated","lastUpdatedBy","status","userType","approver"',
    )
    expect(csvLines[1]).toEqual(
      '"AICIAD","Anastazia","Armistead","anastazia.armistead@justice.gov.uk","For testing","2020-04-19","2024-03-19T04:39:08","2024-03-19T04:39:08","ADMIN","EXPIRED","DIGITAL","Sharlotte Muirhead"',
    )
    expect(csvLines[2]).toEqual(
      '"ZAFIRAHT9YH","Litany","Storm","litany.storm@justice.gov.uk","For testing","2099-04-19","2024-03-19T04:39:08","2024-03-19T04:39:08","ADMIN","ACTIVE","GENERAL","Sharlotte Muirhead"',
    )
  })

  test('Should fail attempting to search allow list users if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_SOME_REQUIRED_ROLE'] })

    await page.goto(paths.userAllowList.search.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
