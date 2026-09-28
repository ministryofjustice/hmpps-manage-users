import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class DeleteConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly confirmedGroup: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, groupText: string) {
    super(page)
    this.header = page.getByRole('heading', { name: `Delete ${groupText}` })
    this.confirmedGroup = this.textBox(`Are you sure you want to delete this ${groupText}?`)
    this.submit = this.button(`Delete ${groupText}`)
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, groupText: string): Promise<DeleteConfirmationPage> {
    const deleteConfirmationPage = new DeleteConfirmationPage(page, groupText)
    await expect(deleteConfirmationPage.header).toBeVisible()
    return deleteConfirmationPage
  }
}
