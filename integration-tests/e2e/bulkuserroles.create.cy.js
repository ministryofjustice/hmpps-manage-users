const path = require('path')

const MenuPage = require('../pages/menuPage')
const CreateBulkUserRolesRequestPage = require('../pages/createBulkUserRolesRequestPage')
const CreateBulkUserRolesSelectRolesPage = require('../pages/createBulkUserRolesSelectRolesPage')
const CreateBulkUserRolesUploadUsersPage = require('../pages/createBulkUserRolesUploadUsersPage')

context('Create bulk user roles request: Jira reference', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show Change user roles in bulk input jira reference', () => {
    assertIsOnChangeUserRolesInBulkPage()
  })

  it('Should show error if empty jira reference is submitted', () => {
    let newBulkUserRolesRequestPage = assertIsOnChangeUserRolesInBulkPage()

    newBulkUserRolesRequestPage.submitJiraReference().click()
    newBulkUserRolesRequestPage = CreateBulkUserRolesRequestPage.verifyOnPage()
    newBulkUserRolesRequestPage.errorSummary().should('contain.text', 'jira reference is required and cannot be empty')
  })

  it('Should show select roles page when valid jira reference is submitted', () => {
    enterJiraReference('1234567890')
    CreateBulkUserRolesSelectRolesPage.verifyOnPage()
  })
})

context('Create bulk user roles request: Select Roles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show select roles page with list of all available roles', () => {
    enterJiraReference('1234567890')

    const selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.inputHint().should('contain.text', 'Choose one or more roles to assign. You can select up to 2')

    selectRolesPage.selectRolesTableHasRows(3)
    selectRolesPage.selectRolesTableRowColumnContains(0, 0, 'Select Maintain Roles')
    selectRolesPage.selectRolesTableRowColumnContains(0, 1, 'Maintain Roles')
    selectRolesPage.selectRolesTableRowColumnContains(0, 2, 'MAINTAIN_ACCESS_ROLES')
    selectRolesPage.rowIsChecked(0, false)

    selectRolesPage.selectRolesTableRowColumnContains(1, 0, 'Select User Admin')
    selectRolesPage.selectRolesTableRowColumnContains(1, 1, 'User Admin')
    selectRolesPage.selectRolesTableRowColumnContains(1, 2, 'USER_ADMIN')
    selectRolesPage.rowIsChecked(1, false)

    selectRolesPage.selectRolesTableRowColumnContains(2, 0, 'Select SAR Data Access')
    selectRolesPage.selectRolesTableRowColumnContains(2, 1, 'SAR Data Access')
    selectRolesPage.selectRolesTableRowColumnContains(2, 2, 'SAR_DATA_ACCESS')
    selectRolesPage.rowIsChecked(2, false)

    selectRolesPage.submitButton().should('contain.text', 'Select Roles')
  })

  it('Should show error if more than the maximum roles are selected', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['MAINTAIN_ACCESS_ROLES', 'USER_ADMIN', 'SAR_DATA_ACCESS'])

    const selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.errorSummary().should('contain.text', 'a maximum of 2 roles can be selected')
    selectRolesPage.rowIsChecked(0, true)
    selectRolesPage.rowIsChecked(1, true)
    selectRolesPage.rowIsChecked(2, true)
  })

  it('Should show invalid role error when an invalid role is submitted', () => {
    enterJiraReference('1234567890')
    let selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.changeSelectRoleCheckboxValueAndCheck('MAINTAIN_ACCESS_ROLES', 'MADE_UP_ROLE_1')
    selectRolesPage.submitButton().click()

    selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.errorSummary().should('contain.text', 'invalid role value selected MADE_UP_ROLE_1')
  })

  it('Should retain valid role selections when invalid role error is displayed', () => {
    enterJiraReference('1234567890')
    let selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.selectRoles(['SAR_DATA_ACCESS'])
    selectRolesPage.changeSelectRoleCheckboxValueAndCheck('MAINTAIN_ACCESS_ROLES', 'MADE_UP_ROLE_1')
    selectRolesPage.submitButton().click()

    selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.errorSummary().should('contain.text', 'invalid role value selected MADE_UP_ROLE_1')
    selectRolesPage.rowIsChecked(0, false)
    selectRolesPage.rowIsChecked(1, false)
    selectRolesPage.rowIsChecked(2, true)
  })

  it('should show upload users page when valid roles selected', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    uploadUsersPage.fileUploadHint()
  })
})

context('Create bulk user roles request: Upload user file', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('should show upload users page with error when upload is clicked with no file specified', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    uploadUsersPage.fileUploadHint()
    selectAndUploadFile(uploadUsersPage, null)

    uploadUsersPage.assertErrorSummary()
    uploadUsersPage.fileUploadError().should('contain.text', 'file is required but was null')
  })

  it('should show upload page with error when a non .csv is uploaded', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    selectAndUploadFile(uploadUsersPage, 'users-html-file.html')

    uploadUsersPage.assertErrorSummary()
    uploadUsersPage.fileUploadError().should('contain.text', 'csv file is required')
  })

  it('should show upload page with error when csv file is empty', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    selectAndUploadFile(uploadUsersPage, 'empty-users.csv')

    uploadUsersPage.assertErrorSummary()
    uploadUsersPage.fileUploadError().should('contain.text', 'csv must contain at least 1 row')
  })

  it('should show upload page with error when csv contains only a header row', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    selectAndUploadFile(uploadUsersPage, 'users-no-header.csv')

    uploadUsersPage.assertErrorSummary()
    uploadUsersPage.fileUploadError().should('contain.text', 'csv must contain at least 1 row')
  })

  it('should show upload page with error when csv contains more than 1 column', () => {
    enterJiraReference('1234567890')
    selectRolesAndSubmit(['SAR_DATA_ACCESS'])

    const uploadUsersPage = CreateBulkUserRolesUploadUsersPage.verifyOnPage()
    selectAndUploadFile(uploadUsersPage, 'users-multiple-columns.csv')

    uploadUsersPage.assertErrorSummary()
    uploadUsersPage.fileUploadError().should('contain.text', 'csv file should contain single column "userId"')
  })
})

function goToChangeUserRolesInBulk() {
  cy.task('stubSignIn', { roles: [{ roleCode: 'BULK_USER_ROLES_ADMIN' }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()
  menuPage.createBulkUserRoles().click()

  return CreateBulkUserRolesRequestPage.verifyOnPage()
}

function assertIsOnChangeUserRolesInBulkPage() {
  const newBulkUserRolesRequestPage = goToChangeUserRolesInBulk()
  newBulkUserRolesRequestPage.jiraReferenceInput().should('exist')
  newBulkUserRolesRequestPage.jiraReferenceInput().should('be.empty')
  newBulkUserRolesRequestPage.submitJiraReference().should('exist')
  return newBulkUserRolesRequestPage
}

function enterJiraReference(jiraReference) {
  const newBulkUserRolesRequestPage = assertIsOnChangeUserRolesInBulkPage()
  newBulkUserRolesRequestPage.jiraReferenceInput().type(jiraReference)
  newBulkUserRolesRequestPage.submitJiraReference().click()
}

function selectRolesAndSubmit(roles) {
  const selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
  selectRolesPage.selectRoles(roles)
  selectRolesPage.submitButton().click()
}

function selectAndUploadFile(uploadUsersPage, filename) {
  if (filename !== undefined && filename !== null) {
    uploadUsersPage.chooseFile().selectFile(resolveResourcePath(filename))
  }
  uploadUsersPage.uploadButton().click()
}

function resolveResourcePath(filename) {
  return path.join(__dirname, '..', '..', 'fixtures', 'bulkUserRoles', filename)
}
