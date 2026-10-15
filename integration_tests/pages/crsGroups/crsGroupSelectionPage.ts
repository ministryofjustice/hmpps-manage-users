import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CrsGroupSelectionPage extends AbstractPage {
  readonly header: Locator

  readonly errorSummary: Locator

  readonly selectedGroupHeader: Locator

  readonly selectedGroupName: Locator

  readonly downloadButton: Locator

  readonly changeGroupLink: Locator

  readonly emptyGroupMessage: Locator

  readonly groupSelector: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'CRS Group Selection' })
    this.errorSummary = page.getByTestId('error-summary')
    this.selectedGroupHeader = page.getByTestId('selected-group-header')
    this.selectedGroupName = page.getByTestId('selected-group-value')
    this.downloadButton = this.button('Download')
    this.changeGroupLink = this.link('Change group')
    this.emptyGroupMessage = page.getByTestId('empty-group-selected-message')
    this.groupSelector = page.locator('#crs-group-selector')
    this.continueButton = this.button('Continue')
  }

  static async verifyOnPage(page: Page): Promise<CrsGroupSelectionPage> {
    const crsGroupSelectionPage = new CrsGroupSelectionPage(page)
    await expect(crsGroupSelectionPage.header).toBeVisible()
    return crsGroupSelectionPage
  }
}
