const page = require('./page')

const user = () => cy.get('[id="user"]')
const group = () => cy.get('[id="groupCode"]')
const role = () => cy.get('[id="roleCode"]')
const submit = () => cy.get('button[type="submit"]')

const authUserSearchPage = () =>
  page('Search for an external user', {
    search: (text) => {
      if (text) user().type(text)
      else user().clear()
      submit().click()
    },
    searchGroup: (text) => {
      if (text) group().type(text)
      else user().clear()
    },
    searchRole: (text) => {
      if (text) role().type(text)
      else user().clear()
      submit().click()
    },
  })

export default {
  verifyOnPage: authUserSearchPage,
  goTo: () => {
    cy.visit('/search-external-users')
    return authUserSearchPage()
  },
}
