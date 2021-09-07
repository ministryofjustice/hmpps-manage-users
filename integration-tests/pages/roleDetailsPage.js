const page = require('./page')

const roleDetailsPage = (roleName) =>
  page(`${roleName}`, {
    roleDetails: () => cy.get('[data-qa="role-details"] tbody tr'),
    adminTypes: () => cy.get('[data-qa="admin-type"] tbody tr'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: roleDetailsPage,
}
