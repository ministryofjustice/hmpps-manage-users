import moment from 'moment/moment'

const page = require('./page')

const formatDateString = (dateStr) => (dateStr ? moment(new Date(dateStr)).format('DD/MM/YYYY HH:mm') : null)

const errorSummary = () => cy.get('[data-qa-errors]')
const requestsTable = () => cy.get('#bulk-user-roles-requests-table')
const searchInput = () => cy.get('input[type="search"]#request-search-keyword')
const submitSearch = () => cy.get('button[type="submit"]')

const sortRequestByDate = (expectedOrder) => {
  requestsTable()
    .find('thead tr')
    .eq(0)
    .find('#sort-by-request-date')
    .within(() => {
      cy.get('button, a').click()
    })

  cy.get('#sort-by-request-date').then(($th) => {
    expect($th.attr('aria-sort')).to.equal(expectedOrder)
  })
}

const enterSearchTerm = (searchTerm) => {
  searchInput().should('exist')
  searchInput().type(searchTerm)
  submitSearch().should('exist')
  submitSearch().should('contain.text', 'Search')
  submitSearch().click()
}

const clickRequestDetailsLink = (row) =>
  requestsTable().find('tbody tr').eq(row).find('td').eq(5).find('a').should('have.text', 'View details').click()

const assertRequestsTableRowContains = (row, expected) => {
  requestsTable()
    .find('tbody tr')
    .eq(row)
    .find('td')
    .should('have.length', 6)
    .then(($td) => {
      expect($td.eq(0).text().trim()).to.equal(formatDateString(expected.requestDateTime))

      expect($td.eq(1).text().trim()).to.equal(expected.jiraReference)
      const jiraHref = $td.eq(1).find('a').attr('href')
      expect(jiraHref).to.equal(`https://dsdmoj.atlassian.net/browse/${expected.jiraReference}`)

      expect($td.eq(2).text().trim()).to.equal(expected.requestedBy)
      expect($td.eq(3).text().trim()).to.equal(expected.status)
      expect($td.eq(4).text().trim()).to.equal(expected.status)

      expect($td.eq(5).text().trim()).to.equal('View details')
      const href = $td.eq(5).find('a').attr('href')
      expect(href).to.contain(`/view-bulk-role-changes/requests/${expected.id}`)
    })
}

const assertRequestsTableBodyContains = (expected) => {
  errorSummary().should('not.exist')
  requestsTable().find('tbody tr').should('have.length', expected.length)

  expected.forEach((el, i) => {
    assertRequestsTableRowContains(i, el)
  })
}

const assertRequestsTableBodyIsEmpty = () => {
  errorSummary().should('not.exist')
  requestsTable().find('tbody tr').should('not.exist')
}

const assertRequestsTableHasRows = (expected) => requestsTable().find('tbody tr').should('have.length', expected)

const viewBulkUserRolesRequestsPage = () =>
  page('View bulk role changes', {
    searchInput,
    enterSearchTerm,
    submitSearch,
    clickRequestDetailsLink,
    requestsTable,
    assertRequestsTableHasRows,
    assertRequestsTableRowContains,
    assertRequestsTableBodyContains,
    assertRequestsTableBodyIsEmpty,
    sortRequestByDate,
    errorSummary,
  })

export default {
  verifyOnPage: viewBulkUserRolesRequestsPage,
  goTo: () => {
    cy.visit('view-roles-in-bulk')
    return viewBulkUserRolesRequestsPage()
  },
}
