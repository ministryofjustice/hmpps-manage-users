const page = require('./page')

const groupCode = () => cy.get('[id="groupCode"]')
const groupName = () => cy.get('[id="groupName"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const createChildGroupPage = () =>
  page('Create child group', {
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
  })

export default {
  verifyOnPage: createChildGroupPage,
}
