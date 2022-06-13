const page = require('./page')

const submit = () => cy.get('button[type="submit"]')
const allRadios = () => cy.get('input[type="radio"]')

const userTypeRadioButton = (text) => cy.contains('label', text).prev()

const dpsSelectUserCreatePage = () =>
  page('Create a DPS user', {
    allRadios,
    submit,
    userTypeRadioButton,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: dpsSelectUserCreatePage,
  goTo: () => {
    cy.visit('/create_user')
    return dpsSelectUserCreatePage()
  },
}
