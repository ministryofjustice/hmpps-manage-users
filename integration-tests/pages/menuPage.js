const page = require('./page')

const dpsUsers = () => cy.get('[data-qa="maintain_roles_link"]')
const authUsers = () => cy.get('[data-qa="maintain_auth_users_link"]')
const createUser = () => cy.get('[data-qa="create_auth_user_link"]')
const manageGroups = () => cy.get('[data-qa="manage_groups_link"]')
const manageRoles = () => cy.get('[data-qa="view_roles_link"]')
const createGroup = () => cy.get('[data-qa="create_groups_link"]')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
    headerUsername: () => cy.get('[data-qa="logged-in-name"]'),
    headerCaseload: () => cy.get('[data-qa="active-location"]'),
    manageAuthUsers: () => authUsers().click(),
    createAuthUser: () => createUser().click(),
    searchDpsUsers: () => dpsUsers().click(),
    createGroup: () => createGroup().click(),
    manageGroups: () => manageGroups().click(),
    manageRoles: () => manageRoles().click(),
  })

export default {
  verifyOnPage: menuPage,
}
