const page = require('./page')

const user = () => cy.get('[id="user"]')
const role = () => cy.get('[id="roleCode"]')
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
      else user().clear()
      submit().click()
    },
  })

export default {
  verifyOnPage: dpsUserSearchPage,
  goTo: () => {
    cy.visit('/search-dps-users')
    return dpsUserSearchPage()
  },
}
