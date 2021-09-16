const page = require('./page')

const role = () => cy.get('[data-qa="change-role-name-link"]')
const roleDescription = () => cy.get('[data-qa="change-role-description-link"]')
const roleAdminType = () => cy.get('[data-qa="change-role-admintype-link"]')

const roleDetailsPage = (roleName) =>
  page(`${roleName}`, {
    roleDetails: () => cy.get('[data-qa="role-details"] tbody tr'),
    changeRoleName: () => role().click(),
    changeRoleDescription: () => roleDescription().click(),
    adminType: () => cy.get('[data-qa="admin-type"] tbody tr'),
    changeRoleAdminType: () => roleAdminType().click(),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: roleDetailsPage,
}
