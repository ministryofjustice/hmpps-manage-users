const page = require('./page')

const menuPage = () =>
  page('Manage user accounts', {
    noAdminFunctionsMessage: () => cy.get("[data-qa='no-admin-functions-message']"),
  })

export default {
  verifyOnPage: menuPage,
}
