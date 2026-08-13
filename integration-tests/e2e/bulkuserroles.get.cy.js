const moment = require('moment')
const MenuPage = require('../pages/menuPage')
const ViewBulkUserRolesRequestsPage = require('../pages/viewBulkUserRolesRequestsPage')
const ViewBulkUserRolesRequestDetailsPage = require('../pages/viewBulkUserRolesRequestDetailsPage')

const bulkRolesAdditionsSummary = [
  {
    id: '1000000000001',
    jiraReference: 'jira1001',
    status: 'PENDING',
    requestedBy: 'STEVE_SMITH',
    requestDateTime: '2026-05-11T16:32:05',
  },
  {
    id: '1000000000002',
    jiraReference: 'jira1002',
    status: 'COMPLETE',
    requestedBy: 'STAN_SMITH',
    requestDateTime: '2026-05-11T17:32:05',
  },
  {
    id: '1000000000003',
    jiraReference: 'jira1003',
    status: 'PENDING',
    requestedBy: 'FRANCINE_SMITH',
    requestDateTime: '2026-06-11T11:32:05',
  },
]

context('View bulk user roles requests', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display error message when get requests is unsuccessful', () => {
    cy.task('stubGetBulkUserRolesAdditionsError', { status: 500, body: { message: 'error getting requests' } })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('exist')
    viewBulkUserRolesRequests.errorSummary().should('contain.text', 'API responded with: Internal Server Error')

    // Client will retry failed requests 2 times.
    verifyGetBulkUserRolesAdditionsIsCalled(3)
  })

  it('Should show empty table when API returns empty list', () => {
    cy.task('stubGetBulkUserRolesAdditions', [])

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    verifyGetBulkUserRolesAdditionsIsCalled(1)
  })

  it('Should show view bulk user roles requests order by newest first by default', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)

    const newestFirst = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime),
    )

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(newestFirst)
    verifyGetBulkUserRolesAdditionsIsCalled(1)
  })

  it('Should change order from newest first to oldest first', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)

    const newestFirst = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime),
    )

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(newestFirst)

    const oldestFirst = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(a.requestDateTime) - new Date(b.requestDateTime),
    )

    viewBulkUserRolesRequests.sortRequestByDate('ascending')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(oldestFirst)

    verifyGetBulkUserRolesAdditionsIsCalled(1)
  })

  it('Search should filter requests', () => {
    const filteredRequests = [
      {
        id: '1000000000003',
        jiraReference: 'jira1003',
        status: 'PENDING',
        requestedBy: 'FRANCINE_SMITH',
        requestDateTime: '2026-06-11T11:32:05',
      },
    ]
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsWithSearch', { responseBody: filteredRequests, searchTerm: '1003' })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.enterSearchTerm('1003')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(filteredRequests)

    verifyGetBulkUserRolesAdditionsIsCalled(1)
    verifyGetBulkUserRolesAdditionsWithSearchTermIsCalled('1003', 1)
  })

  it('Should display empty table when no requests match search term', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsWithSearch', { responseBody: [], searchTerm: '1003' })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.enterSearchTerm('1003')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    verifyGetBulkUserRolesAdditionsIsCalled(1)
    verifyGetBulkUserRolesAdditionsWithSearchTermIsCalled('1003', 1)
  })

  function verifyGetBulkUserRolesAdditionsIsCalled(times) {
    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(times)
    })
  }

  function verifyGetBulkUserRolesAdditionsWithSearchTermIsCalled(searchTerm, times) {
    cy.task('verifyGetBulkUserRolesAdditionsWithSearchTerm', searchTerm).should((requests) => {
      expect(requests).to.have.lengthOf(times)
    })
  }
})

context('Get bulk user roles request details', () => {
  const bulkAdditionsPending = {
    ...bulkRolesAdditionsSummary[2],
    totalCount: 1,
    successCount: 0,
    errorCount: 0,
  }

  const bulkAdditionsComplete = {
    ...bulkRolesAdditionsSummary[1],
    totalCount: 1,
    successCount: 1,
    errorCount: 0,
  }

  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should navigate to request details page', () => {
    const apiResponse = { id: bulkAdditionsPending.id, status: 200, responseBody: bulkAdditionsPending }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(0)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.summaryList().should('exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(0, 'ID', bulkAdditionsPending.id)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(1, 'Jira reference', bulkAdditionsPending.jiraReference)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(
      2,
      'Date requested',
      formatDateString(bulkAdditionsPending.requestDateTime),
    )
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(3, 'Requested by', bulkAdditionsPending.requestedBy)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsPending.status)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(5, 'Total additions', bulkAdditionsPending.totalCount)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(6, 'Successful', bulkAdditionsPending.successCount)
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(7, 'Errored', bulkAdditionsPending.errorCount)
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.disabled')

    verifyGetBulkUserRolesAdditionsDetailsIsCalled(1, apiResponse.id)
  })

  it('Download should be disabled when status is PENDING', () => {
    const apiResponse = { id: bulkAdditionsPending.id, status: 200, responseBody: bulkAdditionsPending }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(0)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsPending.status)
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.disabled')

    verifyGetBulkUserRolesAdditionsDetailsIsCalled(1, apiResponse.id)
  })

  it('Download should be enabled when status is COMPLETE', () => {
    const apiResponse = { id: bulkAdditionsComplete.id, status: 200, responseBody: bulkAdditionsComplete }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(1)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsComplete.status)
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('not.be.disabled')

    verifyGetBulkUserRolesAdditionsDetailsIsCalled(1, apiResponse.id)
  })

  it('Should display error message when fails to get details from API', () => {
    const apiResponse = {
      id: bulkAdditionsComplete.id,
      status: 500,
      responseBody: { message: 'Internal Server Error' },
    }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(1)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('exist')
    viewBulkUserRolesRequestDetailsPage
      .errorSummary()
      .should('contain.text', 'There was a problem')
      .should('contain.text', apiResponse.responseBody.message)

    viewBulkUserRolesRequestDetailsPage.summaryList().should('exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(0, 'ID', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(1, 'Jira reference', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(2, 'Date requested', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(3, 'Requested by', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(5, 'Total additions', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(6, 'Successful', '')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(7, 'Errored', '')

    // Client will retry 2 times on failure.
    verifyGetBulkUserRolesAdditionsDetailsIsCalled(3, bulkAdditionsComplete.id)
  })

  function verifyGetBulkUserRolesAdditionsDetailsIsCalled(times, id) {
    cy.task('verifyGetBulkUserRolesAdditionsDetails', id).should((requests) => {
      expect(requests).to.have.lengthOf(times)
    })
  }
})

context('Get bulk user roles additions download csv', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  const bulkAdditionsComplete = {
    ...bulkRolesAdditionsSummary[1],
    totalCount: 1,
    successCount: 1,
    errorCount: 0,
  }

  it('Get bulk user roles additions download csv success', () => {
    const apiResponse = { id: bulkAdditionsComplete.id, status: 200, responseBody: bulkAdditionsComplete }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)
    cy.task('stubGetBulkUserRolesAdditionsCsvDownload', apiResponse.id)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(1)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', 'COMPLETE')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('not.be.disabled')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().click()

    cy.request(`/view-bulk-role-changes/requests/${apiResponse.id}/download`).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.contain(`text/csv`)
      expect(response.headers['content-disposition']).to.eq(
        `attachment; filename="bulk-roles-assignments-${bulkAdditionsComplete.id}.csv"`,
      )
      expect(response.body).to.contain('user_1,role_1,SUCCESS,')
      expect(response.body).to.contain('user_2,role_1,ERROR,already assigned')
    })
  })

  it('Get bulk user roles additions download csv error download file containing error message', () => {
    const apiResponse = { id: bulkAdditionsComplete.id, status: 200, responseBody: bulkAdditionsComplete }

    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)
    cy.task('stubGetBulkUserRolesAdditionsCsvDownloadError', bulkAdditionsComplete.id)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(1)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', 'COMPLETE')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('not.be.disabled')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().click()

    cy.request({
      url: `/view-bulk-role-changes/requests/${bulkAdditionsComplete.id}/download`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.contain(`application/json`)
      expect(response.headers['content-disposition']).to.eq(
        `attachment; filename="bulk-roles-assignments-${bulkAdditionsComplete.id}-ERROR.json"`,
      )
      expect(response.body).to.contain({
        message: `Internal Server Error: unable to generate bulk role additions csv for: ${bulkAdditionsComplete.id}`,
      })
    })
  })
})

function signIn() {
  cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_BULK_JOBS' }] })
  cy.signIn()
}

function formatDateString(dateStr) {
  return dateStr ? moment(new Date(dateStr)).format('DD/MM/YYYY HH:mm') : null
}

function navigateToViewBulkUserRolesRequestsPage() {
  signIn()
  const menuPage = MenuPage.verifyOnPage()
  menuPage.viewBulkUserRoles().click()
  return ViewBulkUserRolesRequestsPage.verifyOnPage()
}
