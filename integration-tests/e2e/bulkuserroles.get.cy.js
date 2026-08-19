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
  {
    id: '1000000000004',
    jiraReference: 'jira1004',
    status: 'PENDING',
    requestedBy: 'AAA',
    requestDateTime: '2026-06-11T11:32:05',
  },
  {
    id: '1000000000005',
    jiraReference: 'jira1005',
    status: 'PENDING',
    requestedBy: 'BBB',
    requestDateTime: '2026-06-11T11:33:05',
  },
  {
    id: '1000000000006',
    jiraReference: 'jira1006',
    status: 'PENDING',
    requestedBy: 'CCC',
    requestDateTime: '2026-06-11T11:34:05',
  },
  {
    id: '1000000000007',
    jiraReference: 'jira1007',
    status: 'PENDING',
    requestedBy: 'DDD',
    requestDateTime: '2026-06-11T11:35:05',
  },
  {
    id: '1000000000008',
    jiraReference: 'jira1008',
    status: 'PENDING',
    requestedBy: 'EEE',
    requestDateTime: '2026-06-11T11:36:05',
  },
  {
    id: '1000000000009',
    jiraReference: 'jira1009',
    status: 'PENDING',
    requestedBy: 'FFF',
    requestDateTime: '2026-06-11T11:37:05',
  },
  {
    id: '1000000000010',
    jiraReference: 'jira1010',
    status: 'PENDING',
    requestedBy: 'GGG',
    requestDateTime: '2026-06-11T11:38:05',
  },
]

// The table row index of the request with status COMPLETE when the default order by newest first is applied.
const COMPLETE_REQUEST_ROW_INDEX = 8

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
    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(3)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
      assertGetBulkUserRolesAdditionsRequest(requests[1])
      assertGetBulkUserRolesAdditionsRequest(requests[2])
    })
  })

  it('Should show empty table when API returns empty list', () => {
    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf([]))

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })
  })

  it('Should show view bulk user roles requests order by newest first by default', () => {
    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))

    const newestFirst = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime),
    )

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(newestFirst)

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })
  })

  it('Should change order from newest first to oldest first', () => {
    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))

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

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })
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
    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsWithSearch', {
      responseBody: pagedResponseOf(filteredRequests),
      searchTerm: '1003',
    })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.enterSearchTerm('1003')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(filteredRequests)

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(2)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
      assertGetBulkUserRolesAdditionsRequestWithSearch(requests[1], '1003')
    })
  })

  it('Should display empty table when no requests match search term', () => {
    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsWithSearch', { responseBody: pagedResponseOf([]), searchTerm: '1003' })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.enterSearchTerm('1003')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(2)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
      assertGetBulkUserRolesAdditionsRequestWithSearch(requests[1], '1003')
    })
  })

  it('Should paginate results', () => {
    const page1 = bulkRolesAdditionsSummary
    const page2 = [
      {
        id: '1000000000011',
        jiraReference: 'jira1011',
        status: 'PENDING',
        requestedBy: 'HHH',
        requestDateTime: '2026-06-11T11:39:05',
      },
      {
        id: '1000000000012',
        jiraReference: 'jira1012',
        status: 'PENDING',
        requestedBy: 'III',
        requestDateTime: '2026-06-11T11:40:05',
      },
    ]

    const totalRequests = []
    totalRequests.push(...page1)
    totalRequests.push(...page2)

    cy.task('stubGetBulkUserRolesAdditionsByPage', {
      response: pagedResponseOf(page1, 0, totalRequests.length),
      pageNumber: '0',
    })

    cy.task('stubGetBulkUserRolesAdditionsByPage', {
      response: pagedResponseOf(page2, 1, totalRequests.length),
      pageNumber: '1',
    })

    const page1NewestFirst = page1.sort((a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime))

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(page1NewestFirst)

    viewBulkUserRolesRequests
      .getPagination()
      .eq(0)
      .find('.moj-pagination__results')
      .should('contain.text', 'Showing 1 to 10 of 12 total results')

    viewBulkUserRolesRequests
      .getPagination()
      .eq(0)
      .find('.govuk-pagination__list')
      .should('exist')
      .find('li')
      .should('have.length', 2)
      .eq(1)
      .click()

    const page2NewestFirst = page2.sort((a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime))
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(page2NewestFirst)

    viewBulkUserRolesRequests
      .getPagination()
      .eq(0)
      .find('.moj-pagination__results')
      .should('contain.text', 'Showing 11 to 12 of 12 total results')

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(2)
      assertGetBulkUserRolesAdditionsRequest(requests[0], '0', '10')
      assertGetBulkUserRolesAdditionsRequest(requests[1], '1', '10')
    })
  })
})

context('Get bulk user roles request details', () => {
  const bulkAdditionsPending = {
    ...bulkRolesAdditionsSummary[9],
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

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
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

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    cy.task('verifyGetBulkUserRolesAdditionsDetails', bulkAdditionsPending.id).should((requests) => {
      expect(requests).to.have.lengthOf(1)
    })
  })

  it('Download should be disabled when status is PENDING', () => {
    const apiResponse = { id: bulkAdditionsPending.id, status: 200, responseBody: bulkAdditionsPending }

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(0)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsPending.status)
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.disabled')

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    cy.task('verifyGetBulkUserRolesAdditionsDetails', bulkAdditionsPending.id).should((requests) => {
      expect(requests).to.have.lengthOf(1)
    })
  })

  it('Download should be enabled when status is COMPLETE', () => {
    const apiResponse = { id: bulkAdditionsComplete.id, status: 200, responseBody: bulkAdditionsComplete }

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

    const viewBulkUserRolesRequestDetailsPage = ViewBulkUserRolesRequestDetailsPage.verifyOnPage()
    viewBulkUserRolesRequestDetailsPage.errorSummary().should('not.exist')
    viewBulkUserRolesRequestDetailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsComplete.status)
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('be.visible')
    viewBulkUserRolesRequestDetailsPage.downloadResultsButton().should('not.be.disabled')

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    cy.task('verifyGetBulkUserRolesAdditionsDetails', apiResponse.id).should((requests) => {
      expect(requests).to.have.lengthOf(1)
    })
  })

  it('Should display error message when fails to get details from API', () => {
    const apiResponse = {
      id: bulkAdditionsComplete.id,
      status: 500,
      responseBody: { message: 'Internal Server Error' },
    }

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

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

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    // Client will retry a failed request with a 5xx status 2 times before erroring
    cy.task('verifyGetBulkUserRolesAdditionsDetails', bulkAdditionsComplete.id).should((requests) => {
      expect(requests).to.have.lengthOf(3)
    })
  })
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

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)
    cy.task('stubGetBulkUserRolesAdditionsCsvDownload', apiResponse.id)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

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

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    cy.task('verifyGetBulkUserRolesAdditionsDetails', bulkAdditionsComplete.id).should((requests) => {
      expect(requests).to.have.lengthOf(1)
    })
  })

  it('Get bulk user roles additions download csv error download file containing error message', () => {
    const apiResponse = { id: bulkAdditionsComplete.id, status: 200, responseBody: bulkAdditionsComplete }

    cy.task('stubGetBulkUserRolesAdditions', pagedResponseOf(bulkRolesAdditionsSummary))
    cy.task('stubGetBulkUserRolesAdditionsDetails', apiResponse)
    cy.task('stubGetBulkUserRolesAdditionsCsvDownloadError', bulkAdditionsComplete.id)

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

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

    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      assertGetBulkUserRolesAdditionsRequest(requests[0])
    })

    cy.task('verifyGetBulkUserRolesAdditionsDetails', bulkAdditionsComplete.id).should((requests) => {
      expect(requests).to.have.lengthOf(1)
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

function assertGetBulkUserRolesAdditionsRequest(req, pageNumber, pageSize) {
  expect(req.queryParams).to.deep.equal({
    pageNumber: {
      key: 'pageNumber',
      values: [pageNumber ?? '0'],
    },
    pageSize: {
      key: 'pageSize',
      values: [pageSize ?? '10'],
    },
  })
}

function assertGetBulkUserRolesAdditionsRequestWithSearch(req, searchTerm) {
  expect(req.queryParams).to.deep.equal({
    pageNumber: {
      key: 'pageNumber',
      values: ['0'],
    },
    pageSize: {
      key: 'pageSize',
      values: ['10'],
    },
    search: {
      key: 'search',
      values: [searchTerm],
    },
  })
}

function pagedResponseOf(content, pageNumber, totalElements) {
  return {
    content,
    pageable: {
      sort: {
        sorted: false,
        unsorted: true,
        empty: true,
      },
      offset: 0,
      pageNumber: pageNumber ?? 0,
      pageSize: 10,
      paged: true,
      unpaged: false,
    },
    last: false,
    totalPages: 1,
    totalElements: totalElements ?? content?.length ?? 0,
    size: content?.length ?? 0,
    number: pageNumber ?? 0,
    sort: {
      sorted: false,
      unsorted: true,
      empty: true,
    },
    numberOfElements: content?.length ?? 0,
    first: true,
    empty: (content?.length ?? 0) > 0,
  }
}
