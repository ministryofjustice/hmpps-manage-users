const page = require('./page')

const emailField = () => cy.get('#email')
const firstNameField = () => cy.get('#firstName')
const lastNameField = () => cy.get('#lastName')
const groupField = () => cy.get('#groupCode')
const submit = () => cy.get('button[type="submit"]')

const authUserCreatePage = () =>
  page('Create an external user', {
    create: (email, first, last, group) => {
      if (group) groupField().type(group)
      if (email) emailField().type(email)
      if (first) firstNameField().type(first)
      if (last) lastNameField().type(last)
      submit().click()
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: authUserCreatePage,
  goTo: () => {
    cy.visit('/create-external-user')
    return authUserCreatePage()
  },
}
