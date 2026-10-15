import { expect, test } from '@playwright/test'
import { UserAllowlistDetail } from 'manageUsersApiClient'
import { editUser } from '../../helpers/userAllowList'
import { resetStubs } from '../../mockApis/wiremock'
import AuthErrorPage from '../../pages/authErrorPage'
import EditAllowListPage from '../../pages/userAllowList/editPage'
import ViewAllowListPage from '../../pages/userAllowList/viewPage'
import { attemptPostWithoutCsrf, login } from '../../testUtils'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'

const buildAllowlistUser = (overrides: Partial<UserAllowlistDetail> = {}): UserAllowlistDetail => ({
  id: 'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
  username: 'AICIAD',
  email: 'anastazia.armistead@justice.gov.uk',
  firstName: 'Anastazia',
  lastName: 'Armistead',
  reason: 'For testing',
  accessPeriod: 'EXPIRE',
  createdOn: '2024-03-19T04:39:08',
  allowlistEndDate: '2020-04-19',
  lastUpdated: '2024-03-19T04:39:08',
  lastUpdatedBy: 'ADMIN',
  userType: 'GENERAL',
  approver: 'Favio Friedel',
  ...overrides,
})

test.describe('Edit allow list user', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Access period is set to one month by default', async ({ page }) => {
    const editPage = await editUser(page, { user: buildAllowlistUser() })

    await expect(editPage.accessPeriodRadio('One month')).toBeChecked()
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
    const editPage = await editUser(page, { user })

    await expect(editPage.statusTag).toHaveText('Active')
    await expect(editPage.username).toHaveText(user.username)
    await expect(editPage.email).toHaveText(user.email)
    await expect(editPage.firstName).toHaveText(user.firstName)
    await expect(editPage.lastName).toHaveText(user.lastName)
    await expect(editPage.existingReason).toHaveText(user.reason)
    await expect(editPage.approver).toHaveText(user.approver)
  })

  test('Should show details of an expired user', async ({ page }) => {
    const user = buildAllowlistUser({ accessPeriod: 'EXPIRE' })
    const editPage = await editUser(page, { user })

    await expect(editPage.statusTag).toHaveText('Expired')
    await expect(editPage.username).toHaveText(user.username)
    await expect(editPage.email).toHaveText(user.email)
    await expect(editPage.firstName).toHaveText(user.firstName)
    await expect(editPage.lastName).toHaveText(user.lastName)
    await expect(editPage.existingReason).toHaveText(user.reason)
    await expect(editPage.approver).toHaveText(user.approver)
  })

  test('Should submit changes and go to the view page', async ({ page }) => {
    const user = buildAllowlistUser()
    const editPage = await editUser(page, { user })
    await editPage.reason.fill('Needed for extra support in HAAR team.')
    await editPage.submit.click()

    await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
  })

  test('Should show an error when reason is missing', async ({ page }) => {
    const editPage = await editUser(page, { user: buildAllowlistUser() })
    await editPage.submit.click()

    await EditAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
    await expect(editPage.errorSummary).toContainText('Enter a valid business reason')
  })

  test('Should retain the chosen access period on validation errors', async ({ page }) => {
    const editPage = await editUser(page, { user: buildAllowlistUser() })
    await editPage.accessPeriodRadio('Three months').click()
    await editPage.submit.click()

    await EditAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
    await expect(editPage.accessPeriodRadio('Three months')).toBeChecked()
  })

  test('Should cancel and return to the user view page', async ({ page }) => {
    const editPage = await editUser(page, { user: buildAllowlistUser() })
    await editPage.cancel.click()

    await ViewAllowListPage.verifyOnPage(page, 'Anastazia Armistead')
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MANAGE_USER_ALLOW_LIST] })

    await attemptPostWithoutCsrf(page, paths.userAllowList.manage.edit({ username: 'AICIAD' }))
  })

  test('Should fail attempting to edit allow list users if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_SOME_REQUIRED_ROLE'] })

    await page.goto(paths.userAllowList.manage.edit({ username: 'AICIAD' }))
    await AuthErrorPage.verifyOnPage(page)
  })
})
