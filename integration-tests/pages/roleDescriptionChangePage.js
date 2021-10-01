const page = require('./page')

const roleDescription = () => cy.get('[id="roleDescription"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const roleDescriptionChangePage = (role) =>
  page(`Change role description for ${role}`, {
    cancel: () => {
      cancelButton().click()
    },
    changeDescription: (text) => {
      if (text) roleDescription().clear().type(text)
      else roleDescription().clear()
      submit().click()
    },
  })

export default {
  verifyOnPage: roleDescriptionChangePage,
}
