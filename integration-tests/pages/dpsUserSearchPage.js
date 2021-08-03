const page = require('./page')

const user = () => cy.get('[id="user"]')
const role = () => cy.get('[id="roleCode"]')
const caseload = () => cy.get('[id="groupCode"]')
const submit = () => cy.get('button[type="submit"]')

const dpsUserSearchPage = () =>
  page('Search for a DPS user', {
    search: (text) => {
      if (text) user().type(text)
      else user().clear()
      submit().click()
    },
    searchRole: (text) => {
      if (text) role().type(text)
      else role().clear()
      submit().click()
    },
    searchCaseload: (text) => {
      if (text) caseload().type(text)
      else caseload().clear()
      submit().click()
    },
    manageYourDetails: () => cy.get('[data-qa="manage-account-link"]'),
    caseload,
  })

export default {
  verifyOnPage: dpsUserSearchPage,
  goTo: () => {
    cy.visit('/search-dps-users')
    return dpsUserSearchPage()
  },
}
