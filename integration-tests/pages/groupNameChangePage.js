const page = require('./page')

const groupName = () => cy.get('[id="groupName"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const groupNameChangePage = () =>
  page('Change group name', {
    groupRows: () => cy.get('[data-qa="groups"] tbody tr'),
    cancel: () => {
      cancelButton().click()
    },
    changeName: (text) => {
      if (text) groupName().type(text)
      else groupName().clear()
      submit().click()
    },
  })

export default {
  verifyOnPage: groupNameChangePage,
}
