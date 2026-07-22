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

  it('Should show view bulk user roles requests order by newest first by default', () => {
    cy.task('stubGetBulkUserRolesAdditions', bulkRolesAdditionsSummary)
    const sortedRequests = bulkRolesAdditionsSummary.sort(
      (a, b) => new Date(b.requestDateTime) - new Date(a.requestDateTime),
    )

    const viewBulkUserRolesRequests = navigateToViewBulkUserRolesRequestsPage()
    viewBulkUserRolesRequests.errorSummary().should('not.exist')
    viewBulkUserRolesRequests.requestsTableHasRows(3)
    viewBulkUserRolesRequests.requestsTableRowContains(0, sortedRequests[0])
    viewBulkUserRolesRequests.requestsTableRowContains(1, sortedRequests[1])
    viewBulkUserRolesRequests.requestsTableRowContains(2, sortedRequests[2])
  })
})
