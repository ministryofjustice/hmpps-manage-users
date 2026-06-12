const page = require('./page')

const whatsNext = () => cy.get('#bulk-user-roles-next-steps')
const viewRequestLink = () => cy.get('#view-bulk-user-roles-requests')

const createBulkUserRolesSummaryPage = () =>
  page('Bulk user roles request 1234567890 has been submitted', {
    whatsNext,
    viewRequestLink,
    assertErrorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createBulkUserRolesSummaryPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk/submit')
    return createBulkUserRolesSummaryPage()
  },
}
