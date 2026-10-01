import { expect, Page, test } from '@playwright/test'
import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import paths from '../../../server/routes/paths'
import AuthRole from '../../../server/interfaces/authRole'
import AddUserAllowListPage from '../../pages/userAllowList/addUserPage'
import AuthErrorPage from '../../pages/authErrorPage'
import HomePage from '../../pages/homePage'
import SearchAllowListPage from '../../pages/userAllowList/searchPage'

const gotoAddUserToAllowlist = async (page: Page, userType: string = 'General user') => {
  await login(page, { roles: [AuthRole.MANAGE_USER_ALLOW_LIST] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('add_user_to_allow_list')
  return AddUserAllowListPage.verifyOnPage(page).then(addPage => addPage.selectUserType(userType))
}

test.describe('Add user to allow list', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('access period defaults to One month', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await expect(addUserPage.accessPeriodRadio('One month')).toBeChecked()
  })

  test('submit is successful when all fields are filled in', async ({ page }) => {
    await manageUsersApi.stubAddAllowlistUser()
    await manageUsersApi.stubSearchAllowlistUsers()
    await manageUsersApi.stubGetAllowlistUserNotFound('fasha6v')

    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await SearchAllowListPage.verifyOnPage(page)
  })

  test('selecting a general user type shows the reason and access period radios', async ({ page }) => {
    await manageUsersApi.stubAddAllowlistUser()
    await manageUsersApi.stubSearchAllowlistUsers()
    await manageUsersApi.stubGetAllowlistUserNotFound('fasha6v')

    const addUserPage = await gotoAddUserToAllowlist(page, 'General user')
    await expect(addUserPage.accessPeriodRadio('One month')).toBeVisible()
    await expect(addUserPage.accessPeriodRadio('Three months')).toBeVisible()
    await expect(addUserPage.reason).toBeVisible()
    await expect(addUserPage.approver).toBeVisible()
    await expect(addUserPage.username).toBeVisible()
    await expect(addUserPage.email).toBeVisible()
    await expect(addUserPage.firstName).toBeVisible()
    await expect(addUserPage.lastName).toBeVisible()
  })

  test('selecting a digital user type hides the reason and access period radios', async ({ page }) => {
    await manageUsersApi.stubAddAllowlistUser()
    await manageUsersApi.stubSearchAllowlistUsers()
    await manageUsersApi.stubGetAllowlistUserNotFound('fasha6v')

    const addUserPage = await gotoAddUserToAllowlist(page, 'Digital user')
    await expect(addUserPage.accessPeriodRadio('One month')).not.toBeVisible()
    await expect(addUserPage.accessPeriodRadio('Three months')).not.toBeVisible()
    await expect(addUserPage.reason).not.toBeVisible()
    await expect(addUserPage.approver).toBeVisible()
    await expect(addUserPage.username).toBeVisible()
    await expect(addUserPage.email).toBeVisible()
    await expect(addUserPage.firstName).toBeVisible()
    await expect(addUserPage.lastName).toBeVisible()
  })

  test('submit is successful for digital user when all fields are filled in', async ({ page }) => {
    await manageUsersApi.stubAddAllowlistUser()
    await manageUsersApi.stubSearchAllowlistUsers()
    await manageUsersApi.stubGetAllowlistUserNotFound('fasha6v')

    const addUserPage = await gotoAddUserToAllowlist(page, 'Digital user')
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await SearchAllowListPage.verifyOnPage(page)
  })

  test('shows error when username is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.email.fill('test@justice.gov.uk')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Enter a valid username')
  })

  test('shows error when username already exists', async ({ page }) => {
    await manageUsersApi.stubGetAllowlistUser({
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'THREE_MONTHS',
    })

    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('AICIAD')
    await addUserPage.email.fill('anastazia.armistead@justice.gov.uk')
    await addUserPage.firstName.fill('Anastazia')
    await addUserPage.lastName.fill('Armistead')
    await addUserPage.reason.fill('different reason')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Username already exists, please update their access instead')
  })

  test('shows error when email is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Enter an email address')
  })

  test('shows error when email is not valid format', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('not an email')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText(
      'Enter an email address in the correct format, like first.last@justice.gov.uk',
    )
  })

  test('shows error when first name is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Enter a valid first name')
  })

  test('shows error when last name is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Enter a valid last name')
  })

  test('shows error when reason is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText('Enter a valid business reason')
  })

  test('shows error when approver is missing', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.errorSummary).toContainText("Enter the approving manager's name")
  })

  test('retains username value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.username.fill('fasha6v')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.username).toHaveValue('fasha6v')
  })

  test('retains email value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.email.fill('jameisha_mullings2s@employee.zg')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.email).toHaveValue('jameisha_mullings2s@employee.zg')
  })

  test('retains firstName value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.firstName.fill('Derryck')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.firstName).toHaveValue('Derryck')
  })

  test('retains lastName value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.lastName.fill('Siegle')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.lastName).toHaveValue('Siegle')
  })

  test('retains reason value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.reason.fill('for test purposes')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.reason).toHaveValue('for test purposes')
  })

  test('retains approver value on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.approver.fill('Sharlotte Muirhead')
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.approver).toHaveValue('Sharlotte Muirhead')
  })

  test('retains access period selection on error', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.accessPeriodRadio('Three months').click()
    await addUserPage.submit.click()

    await AddUserAllowListPage.verifyOnPage(page)
    await expect(addUserPage.accessPeriodRadio('Three months')).toBeChecked()
  })

  test('cancel returns to the home page', async ({ page }) => {
    const addUserPage = await gotoAddUserToAllowlist(page)
    await addUserPage.cancel.click()

    await HomePage.verifyOnPage(page)
  })

  test('redirects to auth error if user lacks MANAGE_USER_ALLOW_LIST role', async ({ page }) => {
    await login(page, { roles: ['ROLE_SOME_REQUIRED_ROLE'] })

    await page.goto(paths.userAllowList.addUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MANAGE_USER_ALLOW_LIST] })

    await attemptPostWithoutCsrf(page, paths.userAllowList.addUser.pattern)
  })
})
