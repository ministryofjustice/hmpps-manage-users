const MenuPage = require('../pages/menuPage')
const CreateBulkUserRolesRequestPage = require('../pages/createBulkUserRolesRequestPage')
const CreateBulkUserRolesSelectRolesPage = require('../pages/createBulkUserRolesSelectRolesPage')
const CreateBulkUserRolesUploadUsersPage = require('../pages/createBulkUserRolesUploadUsersPage')

context('Change user roles in bulk', () => {
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

  it('Should show error invalid role is selected and submitted', () => {
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
