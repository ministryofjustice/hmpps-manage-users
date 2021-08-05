const page = require('./page')

const authUserSearchPage = () =>
  page('Search results', {
    rows: () => cy.get('table tbody tr'),
    edit: (username) => cy.get(`[data-qa="edit-button-${username}"]`).click(),
    noResults: () => cy.get('[data-qa="no-results"]'),
    nextPage: () => cy.get('.moj-pagination__item--next').first().click(),
    previousPage: () => cy.get('.moj-pagination__item--prev').first().click(),
    getPaginationList: () => cy.get('.moj-pagination__list'),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    statusFilter: () => cy.get('[name="status"]'),
    caseloadFilter: () => cy.get('[name="activeCaseload"]'),
    submitFilter: () => cy.get('button[type="submit"]'),
    download: () => cy.get('button[id="download-button"]'),
  })

export default {
  verifyOnPage: authUserSearchPage,
}
