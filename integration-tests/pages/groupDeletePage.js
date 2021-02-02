const page = require('./page')

const submit = () => cy.get('[data-qa="delete-group-button"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const groupDeletePage = () =>
  page('Delete group', {
    cancel: () => {
      cancelButton().click()
    },
    groupDelete: () => {
      submit().click()
    },
  })

export default {
  verifyOnPage: groupDeletePage,
}
