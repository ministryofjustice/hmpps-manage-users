const MenuPage = require('../pages/menuPage')
const CreateBulkUserRolesRequestPage = require('../pages/createBulkUserRolesRequestPage')
const CreateBulkUserRolesSelectRolesPage = require('../pages/createBulkUserRolesSelectRolesPage')

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
    const newBulkUserRolesRequestPage = assertIsOnChangeUserRolesInBulkPage()
    newBulkUserRolesRequestPage.jiraReferenceInput().type('1234567890')
    newBulkUserRolesRequestPage.submitJiraReference().click()

    const selectRolesPage = CreateBulkUserRolesSelectRolesPage.verifyOnPage()
    selectRolesPage.inputHint().should('contain.text', 'Choose one or more roles to assign. You can select up to 5.')

    selectRolesPage.selectRolesTableHasRows(2)
    selectRolesPage.selectRolesTableRowColumnContains(0, 0, 'Select Maintain Roles')
    selectRolesPage.selectRolesTableRowColumnContains(0, 1, 'Maintain Roles')
    selectRolesPage.selectRolesTableRowColumnContains(0, 2, 'MAINTAIN_ACCESS_ROLES')

    selectRolesPage.selectRolesTableRowColumnContains(1, 0, 'Select User Admin')
    selectRolesPage.selectRolesTableRowColumnContains(1, 1, 'User Admin')
    selectRolesPage.selectRolesTableRowColumnContains(1, 2, 'USER_ADMIN')

    selectRolesPage.submitButton().should('contain.text', 'Select Roles')
  })
})
