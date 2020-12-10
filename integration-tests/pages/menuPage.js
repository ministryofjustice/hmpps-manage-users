const page = require('./page')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
    headerUsername: () => cy.get('.info-wrapper .user-name'),
    headerCaseload: () => cy.get('.info-wrapper .case-load'),
    manageAuthUsers: () => cy.get('#maintain_auth_users_link'),
    manageDpsUsers: () => cy.get('#maintain_roles_link'),
  })

export default {
  verifyOnPage: menuPage,
}
