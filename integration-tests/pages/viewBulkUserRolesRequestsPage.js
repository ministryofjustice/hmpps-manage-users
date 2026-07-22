import moment from 'moment/moment'

const page = require('./page')

const requestsTable = () => cy.get('#bulk-user-roles-requests-table')

const formatDateString = (dateStr) => (dateStr ? moment(new Date(dateStr)).format('DD/MM/YYYY HH:mm') : null)

const viewBulkUserRolesRequestsPage = () =>
  page('View bulk role changes', {
    requestsTable,
    requestsTableHasRows: (expected) => requestsTable().find('tbody tr').should('have.length', expected),
    requestsTableRowContains: (row, expected) => {
      requestsTable()
        .find('tbody tr')
        .eq(row)
        .find('td')
        .should('have.length', 6)
        .then(($td) => {
          expect($td.eq(0).text().trim()).to.equal(formatDateString(expected.requestDateTime))
          expect($td.eq(1).text().trim()).to.equal(expected.jiraReference)
          expect($td.eq(2).text().trim()).to.equal(expected.requestedBy)
          expect($td.eq(3).text().trim()).to.equal(expected.status)
          expect($td.eq(4).text().trim()).to.equal(expected.status)
          expect($td.eq(5).text().trim()).to.equal('View details')

          const href = $td.eq(5).find('a').attr('href')
          expect(href).to.contain(`/view-bulk-role-changes/requests/${expected.id}`)
        })
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: viewBulkUserRolesRequestsPage,
  goTo: () => {
    cy.visit('view-roles-in-bulk')
    return viewBulkUserRolesRequestsPage()
  },
}
