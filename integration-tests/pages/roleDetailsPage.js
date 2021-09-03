const page = require('./page')

const roleDetailsPage = (roleName) =>
  page(`${roleName}`, {
    assignableRoles: () => cy.get('[data-qa="assignable-roles"] tbody tr'),
    childGroups: () => cy.get('[data-qa="child-groups"] tbody tr'),
    manageYourDetails: () => cy.get('[data-qa="manage-account-link"]'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: roleDetailsPage,
}
