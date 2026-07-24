const MenuPage = require('../pages/menuPage')
const ViewBulkUserRolesRequestsPage = require('../pages/viewBulkUserRolesRequestsPage')

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
    status: 'PENDING',
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
    verifyGetBulkUserRolesApiIsCalled(3)
  })

  it('Should show empty table when API returns empty list', () => {
    cy.task('stubGetBulkUserRolesAdditions', [])

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    verifyGetBulkUserRolesApiIsCalled(1)
  })

  it('Should show view bulk user roles requests order by newest first by default', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)

    const newestFirst = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime),
    )

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.assertRequestsTableBodyContains(newestFirst)
    verifyGetBulkUserRolesApiIsCalled(1)
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

    verifyGetBulkUserRolesApiIsCalled(1)
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

    verifyGetBulkUserRolesApiIsCalled(1)
    verifyGetBulkUserRolesWithSearchTermApiIsCalled('1003', 1)
  })

  it('Should display empty table when no requests match search term', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    cy.task('stubGetBulkUserRolesAdditionsWithSearch', { responseBody: [], searchTerm: '1003' })

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.enterSearchTerm('1003')
    viewBulkUserRolesRequests.assertRequestsTableBodyIsEmpty()

    verifyGetBulkUserRolesApiIsCalled(1)
    verifyGetBulkUserRolesWithSearchTermApiIsCalled('1003', 1)
  })

  function signIn() {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_BULK_JOBS' }] })
    cy.signIn()
  }

  function navigateToViewBulkUserRolesRequestsPage() {
    signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.viewBulkUserRoles().click()
    return ViewBulkUserRolesRequestsPage.verifyOnPage()
  }

  function verifyGetBulkUserRolesApiIsCalled(times) {
    cy.task('verifyGetBulkUserRolesAdditions').should((requests) => {
      expect(requests).to.have.lengthOf(times)
    })
  }

  function verifyGetBulkUserRolesWithSearchTermApiIsCalled(searchTerm, times) {
    cy.task('verifyGetBulkUserRolesAdditionsWithSearchTerm', searchTerm).should((requests) => {
      expect(requests).to.have.lengthOf(times)
    })
  }
})
