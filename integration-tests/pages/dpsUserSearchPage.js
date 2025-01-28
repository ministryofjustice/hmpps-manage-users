const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const userFilterInput = () => cy.get('[id="user"]')
const filterWithTag = (tag) => cy.get('a').contains(tag)
const statusFilterRadioButton = (text) => cy.contains('label', text).prev()
const activeCaseloadFilterRadioButton = (text) => cy.contains('label', text).prev()

const caseload = () => cy.get('[id="groupCode"]')
const roleSearch = () => cy.get('[id="roleCode-search"]')
const filterAnyRole = () => cy.get('[id="inclusiveRoles-2"]')
const showOnlyLSAsCheckbox = () => cy.contains('label', 'Local System Administrators only').prev()
const roleCheckbox = (text) => cy.contains('label', text).prev()
const roleCheckboxLabel = (text) => cy.get('label').contains(text)

const dpsUserSearchPage = () =>
  page('Search for a DPS user', {
    filter: () => cy.get('[class="moj-filter"]'),
    filterUser: (text) => {
      if (text) userFilterInput().type(text)
      else userFilterInput().clear()
      applyFilters().click()
      return dpsUserSearchPage()
    },
    filterWithTag,
    userFilterInput,
    statusFilterRadioButton,
    showOnlyLSAsCheckbox,
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
    filterLSAOnly: () => {
      showOnlyLSAsCheckbox().click()
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
      showOnlyLSAsCheckbox().click()
      filterAnyRole().click()
      applyFilters().click()
    },
    filterAllNonAdmin: ({ user, statusText, roleText }) => {
      userFilterInput().type(user)
      statusFilterRadioButton(statusText).click()
      showOnlyLSAsCheckbox().click()
      roleCheckbox(roleText).click()
      applyFilters().click()
    },
    rows: () => cy.get('table tbody tr'),
    getPaginationList: () => cy.get('.moj-pagination__list'),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    getHideDownloadLinkMessage: () => cy.get('[data-qa="exceed-download-limit"]'),
    getDownloadLinkMessage: () => cy.get('[data-qa="download"]'),
    download: () => cy.get('button[data-qa="download"]'),
    lsaDownload: () => cy.get('button[data-qa="lsa-download"]'),
    manageLinkForUser: (user) => cy.get(`a[data-qa="edit-button-${user}"]`),
    manageYourDetails: () => cy.get('[data-qa="manage-account-link"]'),
    caseload,
    paginationLink: (pageNumber) => cy.get('a').contains(pageNumber).first(),
    searchForRole: (text) => {
      if (text) roleSearch().clear().type(text)
      else roleSearch().clear()
      return dpsUserSearchPage()
    },
    role: (text) => roleCheckboxLabel(text),
  })

export default {
  verifyOnPage: dpsUserSearchPage,
  goTo: () => {
    cy.visit('/search-with-filter-dps-users')
    return dpsUserSearchPage()
  },
}
