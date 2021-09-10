const page = require('./page')

const role = () => cy.get('[data-qa="change-role-name-link"]')

const roleDetailsPage = (roleName) =>
  page(`${roleName}`, {
    roleDetails: () => cy.get('[data-qa="role-details"] tbody tr'),
    changeRoleName: () => role().click(),
    adminTypes: () => cy.get('[data-qa="admin-type"] tbody tr'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: roleDetailsPage,
}
