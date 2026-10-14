import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class ViewRequestDetailsPage extends AbstractPage {
  readonly header: Locator

  readonly summaryList: Locator

  readonly errorSummary: Locator

  readonly downloadResultsButton: Locator

  readonly backLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Bulk user roles change' })
    this.summaryList = page.locator('.govuk-summary-list')
    this.errorSummary = page.getByTestId('error-summary')
    this.downloadResultsButton = page.locator('button[type="submit"]#downloadResultsButton')
    this.backLink = page.locator('#details-back')
  }

  static async verifyOnPage(page: Page): Promise<ViewRequestDetailsPage> {
    const viewRequestDetailsPage = new ViewRequestDetailsPage(page)
    await expect(viewRequestDetailsPage.header).toBeVisible()
    return viewRequestDetailsPage
  }

  static async goTo(page: Page, id: string): Promise<ViewRequestDetailsPage> {
    await page.goto(paths.bulkUserRoles.view.details({ id }))
    return ViewRequestDetailsPage.verifyOnPage(page)
  }

  async assertSummaryItem(row: number, expectedKey: string, expectedValue: string) {
    const summaryRow = this.summaryList.locator('.govuk-summary-list__row').nth(row)
    await expect(summaryRow.locator('.govuk-summary-list__key')).toContainText(expectedKey)
    await expect(summaryRow.locator('.govuk-summary-list__value')).toContainText(expectedValue)
  }
}
