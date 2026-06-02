const MenuPage = require('../pages/menuPage')
const CreateBulkUserRolesRequestPage = require('../pages/createBulkUserRolesRequestPage')

function goToChangeUserRolesInBulk() {
  cy.task('stubSignIn', { roles: [{ roleCode: 'BULK_USER_ROLES_ADMIN' }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()
  menuPage.createBulkUserRoles().click()

  return CreateBulkUserRolesRequestPage.verifyOnPage()
}

context('Change user roles in bulk', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show Change user roles in bulk input jira reference', () => {
    const newBulkUserRolesRequestPage = goToChangeUserRolesInBulk()
    newBulkUserRolesRequestPage.jiraReferenceInput().should('exist')
    newBulkUserRolesRequestPage.jiraReferenceInput().should('be.empty')
    newBulkUserRolesRequestPage.submitJiraReference().should('exist')
  })

  it('Should show error if empty jira reference is submitted', () => {
    let newBulkUserRolesRequestPage = goToChangeUserRolesInBulk()
    newBulkUserRolesRequestPage.jiraReferenceInput().should('exist')
    newBulkUserRolesRequestPage.jiraReferenceInput().should('be.empty')
    newBulkUserRolesRequestPage.submitJiraReference().should('exist')

    newBulkUserRolesRequestPage.submitJiraReference().click()
    newBulkUserRolesRequestPage = CreateBulkUserRolesRequestPage.verifyOnPage()
    newBulkUserRolesRequestPage.errorSummary().should('contain.text', 'jira reference is required and cannot be empty')
  })
})
