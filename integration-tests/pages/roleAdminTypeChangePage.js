const page = require('./page')

const roleAdminType = () => cy.get('[type="checkbox"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')
const adminTypeCheckbox = (text) => cy.contains('label', text).prev()

const roleAdminTypeChangePage = () =>
  page('Change role admin type', {
    cancel: () => {
      cancelButton().click()
    },
    changeRoleAdminType: (text) => {
      if (text) roleAdminType().check(text)
      submit().click()
    },
    adminTypeCheckbox,
  })

export default {
  verifyOnPage: roleAdminTypeChangePage,
}