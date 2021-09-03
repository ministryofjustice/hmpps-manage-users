const page = require('./page')

const rolesPage = () =>
  page('Manage roles', {
    rows: () => cy.get('[data-qa="roles"] tbody tr'),
    nextPage: () => cy.get('.moj-pagination__item--next').first().click(),
    previousPage: () => cy.get('.moj-pagination__item--prev').first().click(),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
  })

export default {
  verifyOnPage: rolesPage,
}
