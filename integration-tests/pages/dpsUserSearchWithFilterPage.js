const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const userFilterInput = () => cy.get('[id="user"]')
const filterWithTag = (tag) => cy.get('a').contains(tag)
const statusFilterRadioButton = (text) => cy.contains('label', text).prev()
const activeCaseloadFilterRadioButton = (text) => cy.contains('label', text).prev()

const caseload = () => cy.get('[id="groupCode"]')
const roleSearch = () => cy.get('[id="roleCode-search"]')
const roleCheckbox = (text) => cy.contains('label', text).prev()
const roleCheckboxLabel = (text) => cy.get('label').contains(text)

const dpsUserSearchWithFilterPage = () =>
  page('Search for a DPS user', {
    filter: () => cy.get('[class="moj-filter"]'),
    filterUser: (text) => {
      if (text) userFilterInput().type(text)
      else userFilterInput().clear()
      applyFilters().click()
      return dpsUserSearchWithFilterPage()
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
      roleCheckbox(text).click()
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
      if (Array.isArray(roleText)) {
        roleText.forEach((text) => roleCheckbox(text).click())
      } else {
        roleCheckbox(roleText).click()
      }
      applyFilters().click()
    },
    filterAllNonAdmin: ({ user, statusText, roleText }) => {
      userFilterInput().type(user)
      statusFilterRadioButton(statusText).click()
      roleCheckbox(roleText).click()
      applyFilters().click()
    },
    rows: () => cy.get('table tbody tr'),
    getPaginationList: () => cy.get('.moj-pagination__list'),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    getHideDownloadLinkMessage: () => cy.get('[data-qa="exceed-download-limit"]'),
    download: () => cy.get('a[data-qa="download"]'),
    manageLinkForUser: (user) => cy.get(`a[data-qa="edit-button-${user}"]`),
    caseload,
    paginationLink: (pageNumber) => cy.get('a').contains(pageNumber),
    searchForRole: (text) => {
      if (text) roleSearch().clear().type(text)
      else roleSearch().clear()
      return dpsUserSearchWithFilterPage()
    },
    role: (text) => roleCheckboxLabel(text),
  })

export default {
  verifyOnPage: dpsUserSearchWithFilterPage,
  goTo: () => {
    cy.visit('/search-with-filter-dps-users')
    return dpsUserSearchWithFilterPage()
  },
}
