const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const userFilterInput = () => cy.get('[id="user"]')
const groupFilterSelect = () => cy.get('[id="groupCode"]')
const roleFilterSelect = () => cy.get('[id="roleCode"]')
const statusFilterRadioButton = (text) => cy.contains('label', text).prev()
const filterWithTag = (tag) => cy.get('a').contains(tag)

const authUserSearchPage = () =>
  page('Search for an external user', {
    filter: () => cy.get('[class="moj-filter"]'),
    filterUser: (text) => {
      if (text) userFilterInput().type(text)
      else userFilterInput().clear()
      applyFilters().click()
      return authUserSearchPage()
    },
    filterStatus: (text) => {
      statusFilterRadioButton(text).click()
      applyFilters().click()
    },
    filterGroup: (text) => {
      if (text) groupFilterSelect().type(text)
      else groupFilterSelect().clear()
      applyFilters().click()
      return authUserSearchPage()
    },
    filterRole: (text) => {
      if (text) roleFilterSelect().type(text)
      else roleFilterSelect().clear()
      applyFilters().click()
      return authUserSearchPage()
    },
    filterAll: ({ user, statusText, groupText, roleText }) => {
      userFilterInput().type(user)
      statusFilterRadioButton(statusText).click()
      groupFilterSelect().type(groupText)
      roleFilterSelect().type(roleText)
      applyFilters().click()
    },
    rows: () => cy.get('table tbody tr'),
    getPaginationList: () => cy.get('.moj-pagination__list'),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    paginationLink: (pageNumber) => cy.get('a').contains(pageNumber).first(),
    nextPage: () => cy.get('.moj-pagination__item--next').first().click(),
    previousPage: () => cy.get('.moj-pagination__item--prev').first().click(),
    getHideDownloadLinkMessage: () => cy.get('[data-qa="exceed-download-limit"]'),
    getDownloadLinkMessage: () => cy.get('[data-qa="download"]'),
    download: () => cy.get('a[data-qa="download"]'),
    filterWithTag,
    userFilterInput,
    groupFilterSelect,
    roleFilterSelect,
    statusFilterRadioButton,
    noResults: () => cy.get('[data-qa="no-results"]'),
  })

export default {
  verifyOnPage: authUserSearchPage,
  goTo: () => {
    cy.visit('/search-external-users')
    return authUserSearchPage()
  },
}
