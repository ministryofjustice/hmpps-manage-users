const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const userFilterInput = () => cy.get('[id="user"]')
const filterWithTag = (tag) => cy.get('a').contains(tag)

const dpsUserSearchWithFilterPage = () =>
  page('Search for a DPS user (BETA)', {
    filter: () => cy.get('[class="moj-filter"]'),
    filterUser: (text) => {
      if (text) userFilterInput().type(text)
      else userFilterInput().clear()
      applyFilters().click()
    },
    filterWithTag,
    userFilterInput,
  })

export default {
  verifyOnPage: dpsUserSearchWithFilterPage,
  goTo: () => {
    cy.visit('/search-with-filter-dps-users')
    return dpsUserSearchWithFilterPage()
  },
}
