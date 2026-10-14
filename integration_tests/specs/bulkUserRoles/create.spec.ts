import path from 'path'
import { expect, Page, test } from '@playwright/test'
import { login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { getMatchingRequests } from '../../mockApis/wiremock'
import AuthRole from '../../../server/interfaces/authRole'
import { HttpStatusCode } from '../../../server/utils/utils'
import HomePage from '../../pages/homePage'
import CreateRequestPage from '../../pages/bulkUserRoles/createRequestPage'
import SelectRolesPage from '../../pages/bulkUserRoles/selectRolesPage'
import UploadUsersPage from '../../pages/bulkUserRoles/uploadUsersPage'
import SummaryPage from '../../pages/bulkUserRoles/summaryPage'
import ConfirmationPage from '../../pages/bulkUserRoles/confirmationPage'

const roles = [
  { roleCode: 'MAINTAIN_ACCESS_ROLES', roleName: 'Maintain Roles', roleDescription: 'Maintain Roles' },
  { roleCode: 'USER_ADMIN', roleName: 'User Admin', roleDescription: 'User Admin' },
  { roleCode: 'SAR_DATA_ACCESS', roleName: 'SAR Data Access', roleDescription: 'SAR Data Access' },
]

const resolveFixturePath = (filename: string) => path.join(__dirname, '..', '..', 'fixtures', 'bulkUserRoles', filename)

const gotoCreateBulkUserRoles = async (page: Page) => {
  await login(page, { roles: [AuthRole.MANAGE_USER_BULK_JOBS] })
  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_bulk_user_roles_link')
  return CreateRequestPage.verifyOnPage(page)
}

const enterJiraReference = async (page: Page, jiraReference: string) => {
  const createRequestPage = await gotoCreateBulkUserRoles(page)
  await createRequestPage.jiraReferenceInput.fill(jiraReference)
  await createRequestPage.submitJiraReference.click()
}

const selectRolesAndSubmit = async (page: Page, selectedRoles: string[]) => {
  const selectRolesPage = await SelectRolesPage.verifyOnPage(page)
  await selectRolesPage.selectRoles(selectedRoles)
  await selectRolesPage.submitButton.click()
}

const uploadUserFile = async (page: Page, filename?: string) => {
  const uploadUsersPage = await UploadUsersPage.verifyOnPage(page)
  if (filename) {
    await uploadUsersPage.chooseFile.setInputFiles(resolveFixturePath(filename))
  }
  await uploadUsersPage.uploadButton.click()
  return uploadUsersPage
}

const progressToSummary = async (page: Page, jiraReference: string) => {
  await manageUsersApi.stubSearchableRoles(roles)
  await enterJiraReference(page, jiraReference)
  await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])
  await uploadUserFile(page, 'valid-users.csv')
  return SummaryPage.verifyOnPage(page)
}

test.describe('Create bulk user roles request', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show change user roles in bulk page with empty jira reference input', async ({ page }) => {
    const createRequestPage = await gotoCreateBulkUserRoles(page)
    await expect(createRequestPage.jiraReferenceInput).toBeVisible()
    await expect(createRequestPage.jiraReferenceInput).toBeEmpty()
  })

  test('Should show error if empty jira reference is submitted', async ({ page }) => {
    const createRequestPage = await gotoCreateBulkUserRoles(page)
    await createRequestPage.submitJiraReference.click()

    await CreateRequestPage.verifyOnPage(page)
    await expect(createRequestPage.errorSummary).toContainText('jira reference is required and cannot be empty')
  })

  test('Should show select roles page when valid jira reference is submitted', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')

    await SelectRolesPage.verifyOnPage(page)
  })

  test('Should show select roles page with list of all available roles', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')

    const selectRolesPage = await SelectRolesPage.verifyOnPage(page)
    await expect(selectRolesPage.inputHint).toContainText('Choose one or more roles to assign. You can select up to 5')
    await expect(selectRolesPage.selectRolesTableRows).toHaveCount(3)

    const row0 = selectRolesPage.selectRolesTableRows.nth(0)
    await expect(row0.locator('td').nth(1)).toContainText('Maintain Roles')
    await expect(row0.locator('td').nth(2)).toContainText('MAINTAIN_ACCESS_ROLES')
    await expect(selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES')).not.toBeChecked()
  })

  test('Should show error if more than the maximum roles are selected', async ({ page }) => {
    const manyRoles = [
      ...roles,
      { roleCode: 'ROLE_4', roleName: 'Role 4', roleDescription: 'Role 4' },
      { roleCode: 'ROLE_5', roleName: 'Role 5', roleDescription: 'Role 5' },
      { roleCode: 'ROLE_6', roleName: 'Role 6', roleDescription: 'Role 6' },
    ]
    await manageUsersApi.stubSearchableRoles(manyRoles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(
      page,
      manyRoles.map(r => r.roleCode),
    )

    const selectRolesPage = await SelectRolesPage.verifyOnPage(page)
    await expect(selectRolesPage.errorSummary).toContainText('a maximum of 5 roles can be selected')
    await expect(selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES')).toBeChecked()
  })

  test('Should show invalid role error when an invalid role is submitted', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')

    const selectRolesPage = await SelectRolesPage.verifyOnPage(page)
    await selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES').evaluate((el: HTMLInputElement) => {
      // eslint-disable-next-line no-param-reassign
      el.value = 'MADE_UP_ROLE_1'
    })
    await selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES').check({ force: true })
    await selectRolesPage.submitButton.click()

    await SelectRolesPage.verifyOnPage(page)
    await expect(selectRolesPage.errorSummary).toContainText('invalid role value selected MADE_UP_ROLE_1')
  })

  test('Should retain valid role selections when invalid role error is displayed', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')

    const selectRolesPage = await SelectRolesPage.verifyOnPage(page)
    await selectRolesPage.selectRoles(['SAR_DATA_ACCESS'])
    await selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES').evaluate((el: HTMLInputElement) => {
      // eslint-disable-next-line no-param-reassign
      el.value = 'MADE_UP_ROLE_1'
    })
    await selectRolesPage.roleCheckbox('MAINTAIN_ACCESS_ROLES').check({ force: true })
    await selectRolesPage.submitButton.click()

    await SelectRolesPage.verifyOnPage(page)
    await expect(selectRolesPage.errorSummary).toContainText('invalid role value selected MADE_UP_ROLE_1')
    await expect(selectRolesPage.roleCheckbox('SAR_DATA_ACCESS')).toBeChecked()
  })

  test('should show upload users page when valid roles selected', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await UploadUsersPage.verifyOnPage(page)
    await expect(uploadUsersPage.fileUploadHint).toBeVisible()
  })

  test('should show upload users page with error when upload is clicked with no file specified', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, undefined)
    await expect(uploadUsersPage.errorSummary).toBeVisible()
    await expect(uploadUsersPage.errorSummary).toContainText('file is required but was null')
  })

  test('should show upload page with error when a non .csv is uploaded', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, 'users-html-file.html')
    await expect(uploadUsersPage.errorSummary).toContainText('csv file is required')
  })

  test('should show upload page with error when csv file is empty', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, 'empty-users.csv')
    await expect(uploadUsersPage.errorSummary).toContainText('csv must contain at least 1 row')
  })

  test('should show upload page with error when csv contains only a header row', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, 'users-no-header.csv')
    await expect(uploadUsersPage.errorSummary).toContainText(
      'csv file should contain single column with header "userId"',
    )
  })

  test('should show upload page with error when csv contains more than 1 column', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, 'users-multiple-columns.csv')
    await expect(uploadUsersPage.errorSummary).toContainText(
      'csv file should contain single column with header "userId"',
    )
  })

  test('should show upload page with error when csv contains empty userIds', async ({ page }) => {
    await manageUsersApi.stubSearchableRoles(roles)
    await enterJiraReference(page, '1234567890')
    await selectRolesAndSubmit(page, ['SAR_DATA_ACCESS'])

    const uploadUsersPage = await uploadUserFile(page, 'valid-header-empty-user-value.csv')
    await expect(uploadUsersPage.errorSummary).toContainText('each row must contain a non null non empty userId')
  })

  test('should show summary page with error when not all data has been submitted', async ({ page }) => {
    await login(page, { roles: [AuthRole.MANAGE_USER_BULK_JOBS] })
    const summaryPage = await SummaryPage.goTo(page)

    await expect(summaryPage.errorSummary).toContainText('Jira reference is required')
    await expect(summaryPage.errorSummary).toContainText('Users ids required')
    await expect(summaryPage.errorSummary).toContainText('Roles is required')
    await expect(summaryPage.errorSummary).toContainText('Upload file is required')

    await summaryPage.assertSummaryListRow(0, 'Requested by', 'USER1')
    await summaryPage.assertSummaryListRow(1, 'Jira reference', 'N/A')
    await summaryPage.assertSummaryListRow(2, 'Roles', '')
    await summaryPage.assertSummaryListRow(3, 'Uploaded file', 'N/A')
    await summaryPage.assertSummaryListRow(4, 'Number of users', '0')
    await summaryPage.assertSummaryListRow(5, 'Total assignments', '0')

    await expect(summaryPage.submitButton).toBeDisabled()
  })

  test('should show summary page when valid user csv uploaded', async ({ page }) => {
    const summaryPage = await progressToSummary(page, '1234567890')

    await summaryPage.assertSummaryListRow(0, 'Requested by', 'USER1')
    await summaryPage.assertSummaryListRow(1, 'Jira reference', '1234567890')
    await summaryPage.assertSummaryListRow(2, 'Roles', 'SAR_DATA_ACCESS')
    await summaryPage.assertSummaryListRow(3, 'Uploaded file', 'valid-users.csv')
    await summaryPage.assertSummaryListRow(4, 'Number of users', '2')
    await summaryPage.assertSummaryListRow(5, 'Total assignments', '2')
    await expect(summaryPage.submitButton).toBeEnabled()
  })

  test('should show confirmation page after valid request summary submitted', async ({ page }) => {
    await manageUsersApi.stubCreateBulkUserRolesAdditions({ jiraReference: '1234567890', roles: ['SAR_DATA_ACCESS'] })
    const summaryPage = await progressToSummary(page, '1234567890')
    await summaryPage.submitButton.click()

    const confirmationPage = await ConfirmationPage.verifyOnPage(page, '1234567890')
    await expect(confirmationPage.whatsNext).toContainText('What happens next')
    await expect(confirmationPage.whatsNext).toContainText(
      'You can check on the progress of this request and view it after completion on the view requests page.',
    )
    await expect(confirmationPage.viewRequestLink).toHaveAttribute('href', '/view-bulk-role-changes/requests')
    await expect(confirmationPage.viewRequestLink).toHaveText('View all requests')

    const requests = await getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/manage-users-api/bulk-jobs/user-role-additions',
    })
    expect(requests.length).toBe(1)
  })

  test('should show summary page with error if bulkUserRolesAdditions request returns error status', async ({
    page,
  }) => {
    await manageUsersApi.stubCreateBulkUserRolesAdditions(
      { jiraReference: '1234567890', roles: ['SAR_DATA_ACCESS'] },
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    )
    const summaryPage = await progressToSummary(page, '1234567890')
    await summaryPage.submitButton.click()

    await SummaryPage.verifyOnPage(page)
    await expect(summaryPage.submitErrorSummary).toContainText('Internal Server Error')

    await summaryPage.assertSummaryListRow(0, 'Requested by', 'USER1')
    await summaryPage.assertSummaryListRow(1, 'Jira reference', '1234567890')
    await summaryPage.assertSummaryListRow(2, 'Roles', 'SAR_DATA_ACCESS')
    await summaryPage.assertSummaryListRow(3, 'Uploaded file', 'valid-users.csv')
    await expect(summaryPage.submitButton).toBeEnabled()
  })
})
