import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class ChangeEmailPage extends AbstractPage {
  readonly header: Locator

  readonly emailTextBox: Locator

  readonly confirmButton: Locator

  readonly cancelButton: Locator

  readonly errorSummary: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Change email' })
    this.emailTextBox = this.textBox('Change email')
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<ChangeEmailPage> {
    const createPage = new ChangeEmailPage(page)
    await expect(createPage.header).toBeVisible()
    return createPage
  }
}
