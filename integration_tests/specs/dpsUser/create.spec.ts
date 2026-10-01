import { expect, Page, test } from '@playwright/test'

import { fillAutocompleteSelect, login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import SelectUserTypePage from '../../pages/dpsUser/selectUserTypePage'
import ExistingAccountOptionPage from '../../pages/dpsUser/existingAccountOptionPage'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import CreatePage from '../../pages/dpsUser/createPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { userTypeDisplay, UserTypeKey } from '../../../server/presentation/userType'
import CreateSuccessPage from '../../pages/dpsUser/createSuccessPage'
import AuthRole from '../../../server/interfaces/authRole'

const gotoCreatePage = async (page: Page, userType: UserTypeKey) => {
  await login(page, { roles: [AuthRole.CREATE_USER] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_dps_user_link')
  const selectUserTypePage = await SelectUserTypePage.verifyOnPage(page)
  await selectUserTypePage.radioButton(userTypeDisplay(userType)).click()
  await selectUserTypePage.submit.click()
  const existingAccountOptionPage = await ExistingAccountOptionPage.verifyOnPage(page, userType)
  await manageUsersApi.stubGetCaseloads()
  await existingAccountOptionPage.radioButton('No').click()
  await existingAccountOptionPage.submit.click()
  return CreatePage.verifyOnPage(page, userType)
}

test.describe('Create DPS user', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show all fields for admin user', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_ADM')
    await expect(createPage.username).toBeVisible()
    await expect(createPage.email).toBeVisible()
    await expect(createPage.firstName).toBeVisible()
    await expect(createPage.lastName).toBeVisible()
    await expect(createPage.caseload).not.toBeVisible()
  })

  test('Should show all fields for general user', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await expect(createPage.username).toBeVisible()
    await expect(createPage.email).toBeVisible()
    await expect(createPage.firstName).toBeVisible()
    await expect(createPage.lastName).toBeVisible()
    await expect(createPage.caseload).toBeVisible()
  })

  test('Should show all fields for lsa user', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_LSA')
    await expect(createPage.username).toBeVisible()
    await expect(createPage.email).toBeVisible()
    await expect(createPage.firstName).toBeVisible()
    await expect(createPage.lastName).toBeVisible()
    await expect(createPage.caseload).toBeVisible()
  })

  test('Should show error if no username entered', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter a username')
  })

  test('Should show error if no email entered', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter an email address')
  })

  test('Should show error if no first name entered', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter a first name')
  })

  test('Should show error if no last name entered', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter a last name')
  })

  test('Should show error if no caseload entered', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Select a default caseload')
  })

  test('Should show error if username less than 2 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.username.fill('X')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Username must be 2 characters or more')
  })

  test('Should show error if username greater than 30 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.username.fill('X'.repeat(31))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Username must be 30 characters or less')
  })

  test('Should show error if email is malformed', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.email.fill('X'.repeat(31))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText(
      'Enter an email address in the correct format, like first.last@justice.gov.uk',
    )
  })

  test('Should show error if email has invalid characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.email.fill('annamarie*$£_wittmanr@justice.gov.uk')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText(
      "Email address can only contain 0-9, a-z, @, ', _, ., - and + characters",
    )
  })

  test('Should show error if email is longer than 240 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.email.fill(`${'X'.repeat(100)}@${'Y'.repeat(125)}.justice.gov.uk`)
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Email address must be 240 characters or less')
  })

  test('Should show error if first name less than 2 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.firstName.fill('X')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('First name must be 2 characters or more')
  })

  test('Should show error if first name greater than 35 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.firstName.fill('X'.repeat(36))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('First name must be 35 characters or less')
  })

  test('Should show error if first name has invalid characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.firstName.fill('Kayce&%$')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText(
      'First name must consist of letters, an apostrophe & a hyphen only',
    )
  })

  test('Should show error if last name less than 2 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.lastName.fill('X')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Last name must be 2 characters or more')
  })

  test('Should show error if last name greater than 35 characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.lastName.fill('X'.repeat(36))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Last name must be 35 characters or less')
  })

  test('Should show error if last name has invalid characters', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.lastName.fill('Kayce&%$')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText(
      'Last name must consist of letters, an apostrophe & a hyphen only',
    )
  })

  test('Should show 400 error user message if response is 400', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await manageUsersApi.stubCreateDpsUser400Response()
    await createPage.username.fill('TUSER_GEN')
    await createPage.firstName.fill('Test')
    await createPage.lastName.fill('User')
    await createPage.email.fill('test.user@justice.gov.uk')
    await fillAutocompleteSelect(createPage.caseload, 'Moorland (HMP & YOI)')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Bad request')
  })

  test('Should show user exists error if user exists', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await manageUsersApi.stubCreateDpsUserAlreadyExists()
    await createPage.username.fill('TUSER_GEN')
    await createPage.firstName.fill('Test')
    await createPage.lastName.fill('User')
    await createPage.email.fill('test.user@justice.gov.uk')
    await fillAutocompleteSelect(createPage.caseload, 'Moorland (HMP & YOI)')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Username already exists')
  })

  test('Should show email domain error if invalid email domain', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await manageUsersApi.stubCreateDpsUserInvalidEmailDomain()
    await createPage.username.fill('TUSER_GEN')
    await createPage.firstName.fill('Test')
    await createPage.lastName.fill('User')
    await createPage.email.fill('test.user@notvaliddomain.com')
    await fillAutocompleteSelect(createPage.caseload, 'Moorland (HMP & YOI)')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Invalid Email domain')
  })

  test('Should create a user and go to create success page for valid input', async ({ page }) => {
    const createPage = await gotoCreatePage(page, 'DPS_GEN')
    await createPage.username.fill('TUSER_GEN')
    await createPage.firstName.fill('Test')
    await createPage.lastName.fill('User')
    await createPage.email.fill('test.user@justice.gov.uk')
    await fillAutocompleteSelect(createPage.caseload, 'Moorland (HMP & YOI)')
    await manageUsersApi.stubCreateDpsUser('TUSER_GEN', 'Test', 'User', 'test.user@justice.gov.uk', 'MDI')
    await createPage.submit.click()
    const createSuccessPage = await CreateSuccessPage.verifyOnPage(page)
    await expect(createSuccessPage.email).toContainText('An email has been sent to test.user@justice.gov.uk')
    await expect(createSuccessPage.userDetailsLink).toHaveAttribute(
      'href',
      paths.dpsUser.manage.details({ userId: 'TUSER_GEN' }),
    )
  })

  test('Should go back to user type selection if no user type', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await HomePage.verifyOnPage(page)
    await page.goto(paths.dpsUser.createDpsUser.pattern)
    await SelectUserTypePage.verifyOnPage(page)
  })

  test('Should fail attempting to create dps user if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CREATE_USER'] })

    await page.goto(paths.dpsUser.createDpsUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create dps user if has other manage users role', async ({ page }) => {
    await login(page, { roles: ['ROLE_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.dpsUser.createDpsUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
