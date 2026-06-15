const page = require('./page')

const submitButton = () => cy.get('#accept-confirm')
const summaryList = () => cy.get('#bulk-user-roles-summary-list')

const createBulkUserRolesSummaryPage = () =>
  page('Please confirm change details', {
    submitButton,
    summaryList,
    assertSummaryListRow: (rowIndex, expectedKey, expectedValue, expectedActionHref, expectedActionText) => {
      summaryList()
        .find('.govuk-summary-list__row')
        .eq(rowIndex)
        .within(() => {
          cy.get('.govuk-summary-list__key').should('contain.text', expectedKey)
          cy.get('.govuk-summary-list__value').should('contain.text', expectedValue)

          if (expectedActionHref) {
            cy.get('.govuk-summary-list__actions')
              .eq(0)
              .find('.govuk-link')
              .eq(0)
              .should('have.attr', 'href', expectedActionHref)
              .should('contain.text', expectedActionText)
          }
        })
    },
    assertErrorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createBulkUserRolesSummaryPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk/summary')
    return createBulkUserRolesSummaryPage()
  },
}
