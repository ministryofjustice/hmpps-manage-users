import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class DeactivateReasonPage extends AbstractPage {
  readonly header: Locator

  readonly reason: Locator

  readonly confirmButton: Locator

  readonly cancelButton: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Deactivate account' })
    this.reason = this.textBox('Reason for deactivating account')
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<DeactivateReasonPage> {
    const deactivateReasonPage = new DeactivateReasonPage(page)
    await expect(deactivateReasonPage.header).toBeVisible()
    return deactivateReasonPage
  }
}
