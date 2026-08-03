const page = require('./page')

const errorSummary = () => cy.get('[data-qa-errors]')
const summaryList = () => cy.get('.govuk-summary-list')
const downloadResultsButton = () => cy.get('button[type="submit"][id="downloadResultsButton"]')

const assertSummaryItem = (row, expectedKey, expectedValue) =>
  summaryList()
    .find('.govuk-summary-list__row')
    .eq(row)
    .within(() => {
      cy.get('.govuk-summary-list__key').should('contain.text', expectedKey)
      cy.get('.govuk-summary-list__value').should('contain.text', expectedValue)
    })

const viewBulkUserRolesRequestDetailsPage = () =>
  page('Bulk user roles change', {
    summaryList,
    errorSummary,
    downloadResultsButton,
    assertSummaryItem,
  })

export default {
  verifyOnPage: viewBulkUserRolesRequestDetailsPage,
  goTo: (id) => {
    cy.visit(`view-roles-in-bulk/${id}`)
    return viewBulkUserRolesRequestDetailsPage()
  },
}
