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
})
