const page = require('./page')

const existingUsernameVar = () => cy.get('#existingUsername')
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
    linkLsa: (existingUsername, lsaUsername, caseload) => {
      if (existingUsername) existingUsernameVar().type(existingUsername)
      if (lsaUsername) adminUsernameVar().type(lsaUsername)
      if (caseload) caseloadField().clear().type(caseload)
      submit().click()
    },
    linkGeneral: (username, existingAdminUsername, caseload) => {
      if (username) generalUsername().type(username)
      if (existingAdminUsername) existingUsernameVar().type(existingAdminUsername)
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
