const page = require('./page')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
    headerUsername: () => cy.get('.info-wrapper .user-name'),
    headerCaseload: () => cy.get('.info-wrapper .case-load'),
  })

export default {
  verifyOnPage: menuPage,
}
