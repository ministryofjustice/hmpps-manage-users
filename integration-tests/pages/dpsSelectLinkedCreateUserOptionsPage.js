const page = require('./page')

const submit = () => cy.get('button[type="submit"]')
const allRadios = () => cy.get('input[type="radio"]')

const isLinkedRadioButton = (text) => cy.contains('label', text).prev()

const dpsSelectLinkedCreateUserOptionsPage = (title) =>
  page(title, {
    allRadios,
    submit,
    isLinkedRadioButton,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: dpsSelectLinkedCreateUserOptionsPage,
  goTo: () => {
    cy.visit('/create-user-options')
    return dpsSelectLinkedCreateUserOptionsPage()
  },
}
