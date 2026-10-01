import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class AddGroupPage extends AbstractPage {
  readonly header: Locator

  readonly groupSelect: Locator

  readonly confirmButton: Locator

  readonly cancelButton: Locator

  readonly noGroups: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Select group' })
    this.groupSelect = page.locator('#group')
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.noGroups = page.getByTestId('no-groups')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<AddGroupPage> {
    const addGroupPage = new AddGroupPage(page)
    await expect(addGroupPage.header).toBeVisible()
    return addGroupPage
  }
}
