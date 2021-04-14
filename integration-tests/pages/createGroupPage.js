const page = require('./page')

const groupCode = () => cy.get('[id="groupCode"]')
const groupName = () => cy.get('[id="groupName"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const createGroupPage = () =>
  page('Create group', {
    createGroup: (codeText, groupText) => {
      if (codeText) groupCode().type(codeText)
      else groupCode().clear()
      if (groupText) groupName().type(groupText)
      else groupName().clear()
      submit().click()
    },
    cancel: () => {
      cancelButton().click()
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createGroupPage,
}
