const page = require('./page')

const roleCode = () => cy.get('[id="roleCode"]')
const roleName = () => cy.get('[id="roleName"]')
const roleDescription = () => cy.get('[id="roleDescription"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')
const adminTypeCheckbox = (text) => cy.contains('label', text).prev()

const createRolePage = () =>
  page('Create role', {
    createRole: (codeText, roleText, descriptionText, adminTypeText) => {
      if (codeText) roleCode().type(codeText)
      else roleCode().clear()
      if (roleText) roleName().type(roleText)
      else roleName().clear()
      if (descriptionText) roleDescription().type(descriptionText)
      else roleDescription().clear()
      if (adminTypeText) cy.get('[type="checkbox"]').check(adminTypeText)
      submit().click()
    },
    cancel: () => {
      cancelButton().click()
    },
    adminTypeCheckbox,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createRolePage,
  adminTypeCheckbox,
}
