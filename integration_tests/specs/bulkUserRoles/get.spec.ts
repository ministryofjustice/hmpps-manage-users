import { expect, Page, test } from '@playwright/test'
import { BulkUserRoleAdditionsJobSummary } from 'manageUsersApiClient'
import { login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { getMatchingRequests } from '../../mockApis/wiremock'
import AuthRole from '../../../server/interfaces/authRole'
import { HttpStatusCode } from '../../../server/utils/utils'
import HomePage from '../../pages/homePage'
import ViewRequestsPage from '../../pages/bulkUserRoles/viewRequestsPage'
import ViewRequestDetailsPage from '../../pages/bulkUserRoles/viewRequestDetailsPage'

const formatDateString = (dateStr: string) => {
  const date = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const bulkRolesAdditionsSummary: BulkUserRoleAdditionsJobSummary[] = [
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

const navigateToViewBulkUserRolesRequestsPage = async (page: Page) => {
  await login(page, { roles: [AuthRole.MANAGE_USER_BULK_JOBS] })
  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('view_bulk_user_roles_link')
  return ViewRequestsPage.verifyOnPage(page)
}

const assertGetBulkUserRolesAdditionsRequests = async (expectedCount: number) => {
  const requests = await getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/manage-users-api/bulk-jobs/user-role-additions',
  })
  expect(requests.length).toBe(expectedCount)
}

test.describe('View bulk user roles requests', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should display error message when get requests is unsuccessful', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditionsError()

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await expect(viewRequestsPage.errorSummary).toBeVisible()
    await expect(viewRequestsPage.errorSummary).toContainText('API responded with')

    // Client will retry failed requests 2 times.
    await assertGetBulkUserRolesAdditionsRequests(3)
  })

  test('Should show empty table when API returns empty list', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: [] })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await expect(viewRequestsPage.errorSummary).not.toBeVisible()
    await expect(viewRequestsPage.requestsTable.locator('tbody tr')).toHaveCount(0)

    await assertGetBulkUserRolesAdditionsRequests(1)
  })

  test('Should show view bulk user roles requests ordered by newest first by default', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })

    const newestFirst = [...bulkRolesAdditionsSummary].sort(
      (a, b) => new Date(b.requestDateTime).getTime() - new Date(a.requestDateTime).getTime(),
    )

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await expect(viewRequestsPage.errorSummary).not.toBeVisible()
    for (let i = 0; i < newestFirst.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await viewRequestsPage.assertRequestsTableRowContains(i, {
        requestDateTime: formatDateString(newestFirst[i].requestDateTime),
        jiraReference: newestFirst[i].jiraReference,
        requestedBy: newestFirst[i].requestedBy,
        status: newestFirst[i].status,
        id: newestFirst[i].id,
      })
    }

    await assertGetBulkUserRolesAdditionsRequests(1)
  })

  test('Should change order from newest first to oldest first', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await expect(viewRequestsPage.errorSummary).not.toBeVisible()

    const oldestFirst = [...bulkRolesAdditionsSummary].sort(
      (a, b) => new Date(a.requestDateTime).getTime() - new Date(b.requestDateTime).getTime(),
    )

    await viewRequestsPage.sortByDateHeader.locator('button, a').click()
    await expect(viewRequestsPage.sortByDateHeader).toHaveAttribute('aria-sort', 'ascending')
    await viewRequestsPage.assertRequestsTableRowContains(0, {
      requestDateTime: formatDateString(oldestFirst[0].requestDateTime),
      jiraReference: oldestFirst[0].jiraReference,
      requestedBy: oldestFirst[0].requestedBy,
      status: oldestFirst[0].status,
      id: oldestFirst[0].id,
    })

    await assertGetBulkUserRolesAdditionsRequests(1)
  })

  test('Search should filter requests', async ({ page }) => {
    const filteredRequests: BulkUserRoleAdditionsJobSummary[] = [
      {
        id: '1000000000003',
        jiraReference: 'jira1003',
        status: 'PENDING',
        requestedBy: 'FRANCINE_SMITH',
        requestDateTime: '2026-06-11T11:32:05',
      },
    ]
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsWithSearch({
      responseBody: { content: filteredRequests },
      searchTerm: '1003',
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.enterSearchTerm('1003')
    await expect(viewRequestsPage.requestsTable.locator('tbody tr')).toHaveCount(1)
    await viewRequestsPage.assertRequestsTableRowContains(0, {
      requestDateTime: formatDateString(filteredRequests[0].requestDateTime),
      jiraReference: filteredRequests[0].jiraReference,
      requestedBy: filteredRequests[0].requestedBy,
      status: filteredRequests[0].status,
      id: filteredRequests[0].id,
    })

    await assertGetBulkUserRolesAdditionsRequests(2)
  })

  test('Should display empty table when no requests match search term', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsWithSearch({ responseBody: { content: [] }, searchTerm: '1003' })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.enterSearchTerm('1003')
    await expect(viewRequestsPage.errorSummary).not.toBeVisible()
    await expect(viewRequestsPage.requestsTable.locator('tbody tr')).toHaveCount(0)

    await assertGetBulkUserRolesAdditionsRequests(2)
  })

  test('Should paginate results', async ({ page }) => {
    // the list route requests pages of size 20, so build a page1 of 20 items and a page2 of 5 to trigger paging
    const page1: BulkUserRoleAdditionsJobSummary[] = []
    for (let i = 1; i <= 20; i += 1) {
      page1.push({
        id: `10000000000${String(i).padStart(2, '0')}`,
        jiraReference: `jira10${i}`,
        status: 'PENDING',
        requestedBy: `XXX-${i}`,
        requestDateTime: `2026-06-11T11:39:${String(i).padStart(2, '0')}`,
      })
    }
    const page2: BulkUserRoleAdditionsJobSummary[] = []
    for (let i = 21; i <= 25; i += 1) {
      page2.push({
        id: `10000000000${i}`,
        jiraReference: `jira10${i}`,
        status: 'PENDING',
        requestedBy: `XXX-${i}`,
        requestDateTime: `2026-06-11T11:39:${String(i).padStart(2, '0')}`,
      })
    }
    const totalElements = page1.length + page2.length

    await manageUsersApi.stubGetBulkUserRolesAdditionsByPage({
      response: { content: page1, totalElements },
      pageNumber: '0',
    })
    await manageUsersApi.stubGetBulkUserRolesAdditionsByPage({
      response: { content: page2, number: 1, totalElements },
      pageNumber: '1',
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await expect(viewRequestsPage.errorSummary).not.toBeVisible()
    await expect(viewRequestsPage.pagination.first().locator('.moj-pagination__results')).toContainText(
      'Showing 1 to 20 of 25 total results',
    )

    await viewRequestsPage.pagination.first().locator('.govuk-pagination__list li').nth(1).click()

    await expect(viewRequestsPage.errorSummary).not.toBeVisible()
    await expect(viewRequestsPage.pagination.first().locator('.moj-pagination__results')).toContainText(
      'Showing 21 to 25 of 25 total results',
    )

    await assertGetBulkUserRolesAdditionsRequests(2)
  })
})

test.describe('Get bulk user roles request details', () => {
  const bulkAdditionsPending = { ...bulkRolesAdditionsSummary[9], totalCount: 1, successCount: 0, errorCount: 0 }
  const bulkAdditionsComplete = { ...bulkRolesAdditionsSummary[1], totalCount: 1, successCount: 1, errorCount: 0 }

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should navigate to request details page', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsPending.id,
      responseBody: bulkAdditionsPending,
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(0)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await expect(detailsPage.errorSummary).not.toBeVisible()
    await expect(detailsPage.summaryList).toBeVisible()
    await detailsPage.assertSummaryItem(0, 'ID', bulkAdditionsPending.id)
    await detailsPage.assertSummaryItem(1, 'Jira reference', bulkAdditionsPending.jiraReference)
    await detailsPage.assertSummaryItem(2, 'Date requested', formatDateString(bulkAdditionsPending.requestDateTime))
    await detailsPage.assertSummaryItem(3, 'Requested by', bulkAdditionsPending.requestedBy)
    await detailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsPending.status)
    await detailsPage.assertSummaryItem(5, 'Total additions', String(bulkAdditionsPending.totalCount))
    await detailsPage.assertSummaryItem(6, 'Successful', String(bulkAdditionsPending.successCount))
    await detailsPage.assertSummaryItem(7, 'Errored', String(bulkAdditionsPending.errorCount))
    await expect(detailsPage.downloadResultsButton).toBeVisible()
    await expect(detailsPage.downloadResultsButton).toBeDisabled()
  })

  test('Download should be disabled when status is PENDING', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsPending.id,
      responseBody: bulkAdditionsPending,
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(0)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await detailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsPending.status)
    await expect(detailsPage.downloadResultsButton).toBeDisabled()
  })

  test('Download should be enabled when status is COMPLETE', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsComplete.id,
      responseBody: bulkAdditionsComplete,
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await detailsPage.assertSummaryItem(4, 'Processing status', bulkAdditionsComplete.status)
    await expect(detailsPage.downloadResultsButton).toBeEnabled()
  })

  test('Should display error message when fails to get details from API', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsComplete.id,
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      responseBody: { message: 'Internal Server Error' } as never,
    })

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await expect(detailsPage.errorSummary).toBeVisible()
    await expect(detailsPage.errorSummary).toContainText('There was a problem')

    // Client will retry a failed request with a 5xx status 2 times before erroring
    const requests = await getMatchingRequests({
      method: 'GET',
      urlPathPattern: `/manage-users-api/bulk-jobs/user-role-additions/${bulkAdditionsComplete.id}`,
    })
    expect(requests.length).toBe(3)
  })
})

test.describe('Get bulk user roles additions download csv', () => {
  const bulkAdditionsComplete = { ...bulkRolesAdditionsSummary[1], totalCount: 1, successCount: 1, errorCount: 0 }

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Get bulk user roles additions download csv success', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsComplete.id,
      responseBody: bulkAdditionsComplete,
    })
    await manageUsersApi.stubGetBulkUserRolesAdditionsCsvDownload(bulkAdditionsComplete.id)

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await expect(detailsPage.downloadResultsButton).toBeEnabled()

    const [download] = await Promise.all([page.waitForEvent('download'), detailsPage.downloadResultsButton.click()])
    expect(download.suggestedFilename()).toBe(`bulk-roles-assignments-${bulkAdditionsComplete.id}.csv`)
  })

  test('Get bulk user roles additions download csv error download file containing error message', async ({ page }) => {
    await manageUsersApi.stubGetBulkUserRolesAdditions({ content: bulkRolesAdditionsSummary })
    await manageUsersApi.stubGetBulkUserRolesAdditionsDetails({
      id: bulkAdditionsComplete.id,
      responseBody: bulkAdditionsComplete,
    })
    await manageUsersApi.stubGetBulkUserRolesAdditionsCsvDownloadError(bulkAdditionsComplete.id)

    const viewRequestsPage = await navigateToViewBulkUserRolesRequestsPage(page)
    await viewRequestsPage.clickRequestDetailsLink(COMPLETE_REQUEST_ROW_INDEX)

    const detailsPage = await ViewRequestDetailsPage.verifyOnPage(page)
    await expect(detailsPage.downloadResultsButton).toBeEnabled()

    const [download] = await Promise.all([page.waitForEvent('download'), detailsPage.downloadResultsButton.click()])
    expect(download.suggestedFilename()).toBe(`bulk-roles-assignments-${bulkAdditionsComplete.id}-ERROR.json`)
  })
})
