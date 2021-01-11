const page = require('./page')

const group = () => cy.get('[data-qa="change-group-name-link"]')
const child = () => cy.get('[data-qa="edit-button-Child - Site 1 - Group 2"]')
const createChild = () => cy.get('[data-qa="create-child-group-button"]')
const deleteChild = () => cy.get('[data-qa="delete-button-Child - Site 1 - Group 2"]')

const groupDetailsPage = (groupName) =>
  page(`${groupName}`, {
    assignableRoles: () => cy.get('[data-qa="assignable-roles"] tbody tr'),
    childGroups: () => cy.get('[data-qa="child-groups"] tbody tr'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
    changeGroupName: () => group().click(),
    changeChildGroupName: () => child().click(),
    createChildGroup: () => createChild().click(),
    deleteChildGroup: () => deleteChild().click(),
    childGroupNotThere: () => cy.get('Child - Site 1 - Group 2').should('not.exist'),
  })

export default {
  verifyOnPage: groupDetailsPage,
}
