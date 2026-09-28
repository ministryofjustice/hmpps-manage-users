import { expect, test } from '@playwright/test'
import { UserAllowlistDetail } from 'manageUsersApiClient'
import { defaultAllowlistUser, gotoSearchPage } from '../../helpers/userAllowList'
import { login } from '../../testUtils'
import { resetStubs } from '../../mockApis/wiremock'
import AuthErrorPage from '../../pages/authErrorPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import ViewAllowListPage from '../../pages/userAllowList/viewPage'
import EditAllowListPage from '../../pages/userAllowList/editPage'
import SearchAllowListPage from '../../pages/userAllowList/searchPage'
import paths from '../../../server/routes/paths'

const buildAllowlistUser = (overrides: Partial<UserAllowlistDetail> = {}): UserAllowlistDetail => ({
  ...defaultAllowlistUser(),
  ...overrides,
})

test.describe('View allow list user', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show details of an active user', async ({ page }) => {
    const user = buildAllowlistUser({
      username: 'ZAFIRAHT9YH',
      email: 'litany.storm@justice.gov.uk',
      firstName: 'Litany',
      lastName: 'Storm',
      reason: 'For testing',
      accessPeriod: 'ONE_MONTH',
      allowlistEndDate: '2099-04-19',
    })
    await manageUsersApi.stubGetAllowlistUser(user)

    const searchPage = await gotoSearchPage(page, { content: [user] })
    await searchPage.userDetailsLink(user.username).click()
    const viewPage = await ViewAllowListPage.verifyOnPage(page, 'Litany Storm')

    await expect(viewPage.statusTag).toHaveText('Active')
    await expect(viewPage.expiry).toHaveText('No restriction')
    await expect(viewPage.createdDate).toHaveText('19 March 2024')
    await expect(viewPage.lastUpdatedDate).toHaveText('19 March 2024')
    await expect(viewPage.lastUpdatedBy).toHaveText('ADMIN')
    await expect(viewPage.approver).toHaveText('Sharlotte Muirhead')
  })

  test('Should show details of an expired user', async ({ page }) => {
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
    const viewPage = await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')

    await expect(viewPage.statusTag).toHaveText('Expired')
    await expect(viewPage.expiry).toHaveText('19 April 2020')
    await expect(viewPage.createdDate).toHaveText('19 March 2024')
    await expect(viewPage.lastUpdatedDate).toHaveText('19 March 2024')
    await expect(viewPage.lastUpdatedBy).toHaveText('ADMIN')
    await expect(viewPage.approver).toHaveText('Sharlotte Muirhead')
  })

  test('Should click the edit link and go to the edit page', async ({ page }) => {
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
    const viewPage = await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
    await viewPage.editButton.click()

    await EditAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
  })

  test('Should click the search link and go back to search', async ({ page }) => {
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
    const viewPage = await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
    await viewPage.searchLink.click()

    await SearchAllowListPage.verifyOnPage(page)
  })

  test('Should fail attempting to view allow list users if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_SOME_REQUIRED_ROLE'] })

    await page.goto(paths.userAllowList.manage.view({ username: 'AICIAD' }))
    await AuthErrorPage.verifyOnPage(page)
  })
})
