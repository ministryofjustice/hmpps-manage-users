const page = require('./page')

const authUserChangeEmailPage = () =>
  page(`Change email`, {
    amendButton: () => cy.get('[data-qa="confirm-button"]'),
    email: () => cy.get('#email'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: authUserChangeEmailPage,
}
