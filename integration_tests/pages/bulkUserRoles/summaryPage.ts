import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class SummaryPage extends AbstractPage {
  readonly header: Locator

  readonly submitButton: Locator

  readonly summaryList: Locator

  readonly errorSummary: Locator

  readonly submitErrorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Please confirm change details' })
    this.submitButton = page.locator('#accept-confirm')
    this.summaryList = page.locator('#bulk-user-roles-summary-list')
    this.errorSummary = page.getByTestId('error-summary')
    this.submitErrorSummary = page.getByTestId('submit-error-summary')
  }

  static async verifyOnPage(page: Page): Promise<SummaryPage> {
    const summaryPage = new SummaryPage(page)
    await expect(summaryPage.header).toBeVisible()
    return summaryPage
  }

  static async goTo(page: Page): Promise<SummaryPage> {
    await page.goto(paths.bulkUserRoles.create.summary.pattern)
    return SummaryPage.verifyOnPage(page)
  }

  summaryRow(rowIndex: number): Locator {
    return this.summaryList.locator('.govuk-summary-list__row').nth(rowIndex)
  }

  async assertSummaryListRow(rowIndex: number, expectedKey: string, expectedValue: string) {
    const row = this.summaryRow(rowIndex)
    await expect(row.locator('.govuk-summary-list__key')).toContainText(expectedKey)
    await expect(row.locator('.govuk-summary-list__value')).toContainText(expectedValue)
  }
}
