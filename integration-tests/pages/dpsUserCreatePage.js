const page = require('./page')

const usernameField = () => cy.get('#username')
const emailField = () => cy.get('#email')
const firstNameField = () => cy.get('#firstName')
const lastNameField = () => cy.get('#lastName')
const caseloadField = () => cy.get('#defaultCaseloadId')
const submit = () => cy.get('button[type="submit"]')

const dpsUserCreatePage = (title) =>
  page(title, {
    create: (username, email, first, last, caseload) => {
      if (username) usernameField().type(username)
      if (email) emailField().type(email)
      if (first) firstNameField().type(first)
      if (last) lastNameField().clear().type(last)
      if (caseload) caseloadField().clear().type(caseload)
      submit().click()
    },
    submit,
    caseloadField,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: dpsUserCreatePage,
  goTo: () => {
    cy.visit('/create-dps-user')
    return dpsUserCreatePage()
  },
}
