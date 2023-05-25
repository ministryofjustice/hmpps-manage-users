const page = require('./page')

const existingUsernameVar = () => cy.get('#existingUsername')
const existingAdminUsername = () => cy.get('#existingAdminUsername')
const adminUsernameVar = () => cy.get('#adminUsername')
const generalUsername = () => cy.get('#generalUsername')
const caseloadField = () => cy.get('#defaultCaseloadId')
const caseloadLabel = () => cy.get('label[for="defaultCaseloadId"]')
const submit = () => cy.get('button[type=submit]').eq(1)

const dpsUserCreatePage = (title) =>
  page(title, {
    linkAdmin: (existingUsername, adminUsername) => {
      if (existingUsername) existingUsernameVar().type(existingUsername)
      if (adminUsername) adminUsernameVar().type(adminUsername)
      submit().click()
    },
    linkLsa: (username, adminname, caseload) => {
      if (username) existingUsernameVar().type(username)
      if (adminname) adminUsernameVar().type(adminname)
      if (caseload) caseloadField().clear().type(caseload)
      submit().click()
    },
    linkGeneral: (username, adminname, caseload) => {
      if (username) generalUsername().type(username)
      if (adminname) existingAdminUsername().type(adminname)
      if (caseload) caseloadField().clear().type(caseload)
      submit().click()
    },
    submit,
    caseloadField,
    caseloadLabel,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: dpsUserCreatePage,
  goTo: () => {
    cy.visit('/create-dps-user')
    return dpsUserCreatePage()
  },
}
