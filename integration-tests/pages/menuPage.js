const page = require('./page')

const searchUserAllowList = () => cy.get('[data-qa="search_user_allow_list"]')
const addUserToAllowList = () => cy.get('[data-qa="add_user_to_allow_list"]')
const searchDpsUsers = () => cy.get('[data-qa="search_with_filter_dps_users"]')
const searchExternalUsers = () => cy.get('[data-qa="maintain_auth_users_link"]')
const createUser = () => cy.get('[data-qa="create_auth_user_link"]')
const createDpsUser = () => cy.get('[data-qa="create_dps_user_link"]')
const manageGroups = () => cy.get('[data-qa="manage_groups_link"]')
const viewRoles = () => cy.get('[data-qa="view_roles_link"]')
const manageRoles = () => cy.get('[data-qa="view_roles_link"]')
const createGroup = () => cy.get('[data-qa="create_groups_link"]')
const createRole = () => cy.get('[data-qa="create_roles_link"]')
const viewEmailDomainListing = () => cy.get('[data-qa="view_email_domains_link"]')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
    headerUsername: () => cy.get('[data-qa="logged-in-name"]'),
    headerCaseload: () => cy.get('[data-qa="active-location"]'),
    message: () => cy.get('[data-qa="banner-message"]'),
    searchExternalUsers: () => searchExternalUsers().click(),
    searchExternalUsersLink: () => searchExternalUsers(),
    searchUserAllowListTile: () => searchUserAllowList(),
    searchUserAllowListLink: () => searchUserAllowList().find('.card__link'),
    searchUserAllowListDescription: () => searchUserAllowList().find('.card__description'),
    addUserToAllowListTile: () => addUserToAllowList(),
    addUserToAllowListLink: () => addUserToAllowList().find('.card__link'),
    addUserToAllowListDescription: () => addUserToAllowList().find('.card__description'),
    createDpsUserTile: () => createDpsUser(),
    createDpsUser: () => createDpsUser().click(),
    createAuthUser: () => createUser().click(),
    createGroupTile: () => createGroup(),
    createRoleTile: () => createRole(),
    createGroup: () => createGroup().click(),
    manageGroups: () => manageGroups().click(),
    createRole: () => createRole().click(),
    manageRoles: () => manageRoles().click(),
    viewEmailDomainListing: () => viewEmailDomainListing().click(),
    searchDpsUsers,
    viewRoles,
  })

export default {
  verifyOnPage: menuPage,
}
