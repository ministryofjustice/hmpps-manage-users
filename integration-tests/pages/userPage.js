const page = require('./page')

const userPage = (user) =>
  page(user, {
    userRows: () => cy.get('[data-qa="user-details"] tbody tr'),
    roleRows: () => cy.get('[data-qa="user-roles"] tbody tr'),
    groupRows: () => cy.get('[data-qa="user-groups"] tbody tr'),
    addRole: () => cy.get('[data-qa="add-role-button"]'),
    addGroup: () => cy.get('[data-qa="add-group-button"]'),
    removeRole: (role) => cy.get(`[data-qa="remove-button-${role}"]`),
    removeGroup: (group) => cy.get(`[data-qa="remove-button-${group}"]`),
    searchResultsBreadcrumb: () => cy.get('a[href*="results"]'),
    searchBreadcrumb: () => cy.get('a[href*="search-"]'),
    enableLink: () => cy.get('[data-qa="enable-button"]'),
    changeEmailLink: () => cy.get('[data-qa="amend-link"]'),
    searchLink: () => cy.get('[data-qa="search-link"]'),
    enabled: () => cy.get('[data-qa="enabled"]'),
    inactiveReason: () => cy.get('[data-qa="inactive-reason"] tbody tr'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: userPage,
}
