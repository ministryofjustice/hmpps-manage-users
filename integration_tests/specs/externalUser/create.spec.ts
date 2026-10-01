import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { attemptPostWithoutCsrf, fillAutocompleteSelect, login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import paths from '../../../server/routes/paths'
import CreateExternalUserPage from '../../pages/externalUser/createPage'
import CreateExternalUserSuccessPage from '../../pages/externalUser/createSuccessPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import AuthErrorPage from '../../pages/authErrorPage'

const gotoCreateExternalUser = async (page: Page, roles: AuthRole[] = [AuthRole.MAINTAIN_OAUTH_USERS]) => {
  await login(page, { roles })
  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_auth_user_link')
}

test.describe('Create external user', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubAssignableGroups()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show all fields', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await expect(createPage.email).toBeVisible()
    await expect(createPage.firstName).toBeVisible()
    await expect(createPage.lastName).toBeVisible()
    await expect(createPage.groupCode).toBeVisible()
  })

  test('Should show error if no email entered', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter an email address')
  })

  test('Should show error if no first name entered', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter a first name')
  })

  test('Should show error if no last name entered', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Enter a last name')
  })

  test('Should show error if email is malformed', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.email.fill('notanemail')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText(
      'Enter an email address in the correct format, like first.last@justice.gov.uk',
    )
  })

  test('Should show error if first name less than 2 characters', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.firstName.fill('X')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('First name must be 2 characters or more')
  })

  test('Should show error if last name less than 2 characters', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.lastName.fill('X')
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Last name must be 2 characters or more')
  })

  test('Should show error if first name greater than 50 characters', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.firstName.fill('X'.repeat(51))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('First name must be 50 characters or less')
  })

  test('Should show error if last name greater than 50 characters', async ({ page }) => {
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.lastName.fill('X'.repeat(51))
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Last name must be 50 characters or less')
  })

  test('Should show error if user is auth group manage and no group selected', async ({ page }) => {
    await gotoCreateExternalUser(page, [AuthRole.AUTH_GROUP_MANAGER])

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.submit.click()
    await expect(createPage.errorSummary).toContainText('Select a group')
  })

  test('Should successfully create external user', async ({ page }) => {
    await manageUsersApi.stubCreateExternalUser()
    await gotoCreateExternalUser(page)

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.email.fill('newuser@justice.gov.uk')
    await createPage.firstName.fill('John')
    await createPage.lastName.fill('Doe')
    await createPage.submit.click()

    const successPage = await CreateExternalUserSuccessPage.verifyOnPage(page)
    await expect(successPage.email).toContainText('newuser@justice.gov.uk')
  })

  test('Should successfully create external user for auth group manager', async ({ page }) => {
    await manageUsersApi.stubCreateExternalUser()
    await gotoCreateExternalUser(page, [AuthRole.AUTH_GROUP_MANAGER])

    const createPage = await CreateExternalUserPage.verifyOnPage(page)
    await createPage.email.fill('newuser@justice.gov.uk')
    await createPage.firstName.fill('John')
    await createPage.lastName.fill('Doe')
    await fillAutocompleteSelect(createPage.groupCode, 'North West')
    await createPage.submit.click()

    const successPage = await CreateExternalUserSuccessPage.verifyOnPage(page)
    await expect(successPage.email).toContainText('newuser@justice.gov.uk')
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

    await attemptPostWithoutCsrf(page, paths.externalUser.create.pattern)
  })

  test('Should fail attempting to create external user if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_OAUTH_USERS'] })

    await page.goto(paths.externalUser.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create external user if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.externalUser.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
