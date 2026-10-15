import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class ViewRequestsPage extends AbstractPage {
  readonly header: Locator

  readonly searchInput: Locator

  readonly submitSearch: Locator

  readonly requestsTable: Locator

  readonly errorSummary: Locator

  readonly sortByDateHeader: Locator

  readonly pagination: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'View bulk role changes' })
    this.searchInput = page.locator('input[type="search"]#request-search-keyword')
    this.submitSearch = page.locator('button[type="submit"]')
    this.requestsTable = page.locator('#bulk-user-roles-requests-table')
    this.errorSummary = page.getByTestId('error-summary')
    this.sortByDateHeader = page.locator('#sort-by-request-date')
    this.pagination = page.locator('.moj-pagination')
  }

  static async verifyOnPage(page: Page): Promise<ViewRequestsPage> {
    const viewRequestsPage = new ViewRequestsPage(page)
    await expect(viewRequestsPage.header).toBeVisible()
    return viewRequestsPage
  }

  static async goTo(page: Page): Promise<ViewRequestsPage> {
    await page.goto(paths.bulkUserRoles.view.list.pattern)
    return ViewRequestsPage.verifyOnPage(page)
  }

  requestRow(row: number): Locator {
    return this.requestsTable.locator('tbody tr').nth(row)
  }

  async enterSearchTerm(searchTerm: string) {
    await this.searchInput.fill(searchTerm)
    await this.submitSearch.click()
  }

  async clickRequestDetailsLink(row: number) {
    await this.requestRow(row).locator('td').nth(5).locator('a').click()
  }

  async assertRequestsTableRowContains(
    row: number,
    expected: {
      requestDateTime: string
      jiraReference: string
      requestedBy: string
      status: string
      id: string
    },
  ) {
    const cells = this.requestRow(row).locator('td')
    await expect(cells).toHaveCount(6)
    await expect(cells.nth(0)).toHaveText(expected.requestDateTime)
    await expect(cells.nth(1)).toHaveText(expected.jiraReference)
    await expect(cells.nth(1).locator('a')).toHaveAttribute(
      'href',
      `https://dsdmoj.atlassian.net/browse/${expected.jiraReference}`,
    )
    await expect(cells.nth(2)).toHaveText(expected.requestedBy)
    await expect(cells.nth(3)).toHaveText(expected.status)
    await expect(cells.nth(4)).toHaveText(expected.status)
    await expect(cells.nth(5)).toHaveText('View details')
    await expect(cells.nth(5).locator('a')).toHaveAttribute(
      'href',
      paths.bulkUserRoles.view.details({ id: expected.id }),
    )
  }
}
