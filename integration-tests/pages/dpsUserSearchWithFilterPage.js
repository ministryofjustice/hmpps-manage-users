const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const userFilterInput = () => cy.get('[id="user"]')
const filterWithTag = (tag) => cy.get('a').contains(tag)
const statusFilterRadioButton = (text) => cy.contains('label', text).prev()
const activeCaseloadFilterRadioButton = (text) => cy.contains('label', text).prev()

const caseload = () => cy.get('[id="groupCode"]')
const role = () => cy.get('[id="roleCode"]')

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
    statusFilterRadioButton,
    activeCaseloadFilterRadioButton,
    filterStatus: (text) => {
      statusFilterRadioButton(text).click()
      applyFilters().click()
    },
    filterRole: (text) => {
      if (text) role().type(text)
      else role().clear()
      applyFilters().click()
    },
    filterCaseload: (text) => {
      if (text) caseload().type(text)
      else caseload().clear()
      applyFilters().click()
    },
    filterAll: ({ user, statusText, caseloadText, roleText }) => {
      userFilterInput().type(user)
      statusFilterRadioButton(statusText).click()
      caseload().type(caseloadText)
      role().type(roleText)
      applyFilters().click()
    },
    filterAllNonAdmin: ({ user, statusText, roleText }) => {
      userFilterInput().type(user)
      statusFilterRadioButton(statusText).click()
      role().type(roleText)
      applyFilters().click()
    },
    rows: () => cy.get('table tbody tr'),
    getPaginationList: () => cy.get('.moj-pagination__list'),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    download: () => cy.get('a[data-qa="download"]'),
  })

export default {
  verifyOnPage: dpsUserSearchWithFilterPage,
  goTo: () => {
    cy.visit('/search-with-filter-dps-users')
    return dpsUserSearchWithFilterPage()
  },
}
