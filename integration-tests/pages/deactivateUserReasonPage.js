const page = require('./page')

const reason = () => cy.get('[id="reason"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const deactivateUserReasonPage = () =>
  page(`Enter the reason for deactivating`, {
    deactivateUser: (reasonText) => {
      if (reasonText) reason().clear().type(reasonText)
      else reason().clear()
      submit().click()
    },
    cancel: () => {
      cancelButton().click()
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: deactivateUserReasonPage,
}
