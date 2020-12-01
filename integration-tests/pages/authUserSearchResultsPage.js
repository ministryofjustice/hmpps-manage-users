const page = require('./page')

const authUserSearchPage = () =>
  page('Search results', {
    rows: () => cy.get('table tbody tr'),
    edit: (username) => cy.get(`[data-qa="edit-button-${username}"]`).click(),
    noResults: () => cy.get('[data-qa="no-results"]'),
  })

export default {
  verifyOnPage: authUserSearchPage,
}
