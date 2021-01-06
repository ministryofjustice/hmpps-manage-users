const page = require('./page')

const group = () => cy.get('[data-qa="change-group-name-link"]')
const child = () => cy.get('[data-qa="edit-button-Child - Site 1 - Group 2"]')

const groupDetailsPage = () =>
  page('Site 1 - Group 2', {
    assignableRoles: () => cy.get('[data-qa="assignable-roles"] tbody tr'),
    childGroups: () => cy.get('[data-qa="child-groups"] tbody tr'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
    changeGroupName: () => group().click(),
    changeChildGroupName: () => child().click(),
  })

export default {
  verifyOnPage: groupDetailsPage,
}
