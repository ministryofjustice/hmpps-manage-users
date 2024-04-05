const page = require('./page')

const userPage = (user) =>
  page(user, {
    userRows: () => cy.get('[data-qa="user-details"] tbody tr'),
    roleRows: () => cy.get('[data-qa="user-roles"] tbody tr'),
    groupRows: () => cy.get('[data-qa="user-groups"] tbody tr'),
    activeCaseloadRow: () => cy.get('[data-qa="user-active-caseload"] tbody tr'),
    activeCaseload: () => cy.get('[data-qa="user-active-caseload"] tbody tr td'),
    caseloadRows: () => cy.get('[data-qa="user-caseloads"] tbody tr'),
    administeredUserGroups: () => cy.get('[data-qa="prison-user-admin-caseloads"]'),
    administeredUserGroupsRows: () => cy.get('[data-qa="prison-user-admin-caseloads"] tbody tr'),
    addRole: () => cy.get('[data-qa="add-role-button"]'),
    addGroup: () => cy.get('[data-qa="add-group-button"]'),
    addUserCaseload: () => cy.get('[data-qa="add-caseload-button"]'),
    removeRole: (role) => cy.get(`[data-qa="remove-button-${role}"]`),
    removeGroup: (group) => cy.get(`[data-qa="remove-button-${group}"]`),
    removeUserCaseload: (caseload) => cy.get(`[data-qa="remove-button-${caseload}"]`),
    searchBreadcrumb: () => cy.get('a[href*="search-"]'),
    enableLink: () => cy.get('[data-qa="enable-button"]'),
    activateLink: () => cy.get('[data-qa="activate-button"]'),
    deactivateLink: () => cy.get('[data-qa="deactivate-button"]'),
    changeEmailLink: () => cy.get('[data-qa="amend-link"]'),
    searchLink: () => cy.get('[data-qa="search-link"]'),
    enabled: () => cy.get('[data-qa="enabled"]'),
    inactiveReason: () => cy.get('[data-qa="inactive-reason"] tbody tr'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: userPage,
}
