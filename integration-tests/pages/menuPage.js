const page = require('./page')

const dpsUsers = () => cy.get('[data-qa="maintain_roles_link"]')
const authUsers = () => cy.get('[data-qa="maintain_auth_users_link"]')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
    headerUsername: () => cy.get('[data-qa="logged-in-name"]'),
    headerCaseload: () => cy.get('[data-qa="active-location"]'),
    manageAuthUsers: () => authUsers().click(),
    searchDpsUsers: () => dpsUsers().click(),
  })

export default {
  verifyOnPage: menuPage,
}
