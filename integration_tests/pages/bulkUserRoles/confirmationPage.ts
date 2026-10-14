import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ConfirmationPage extends AbstractPage {
  readonly header: Locator

  readonly whatsNext: Locator

  readonly viewRequestLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: /has been submitted/ })
    this.whatsNext = page.locator('#bulk-user-roles-next-steps')
    this.viewRequestLink = page.locator('#view-bulk-user-roles-requests')
  }

  static async verifyOnPage(page: Page, jiraReference: string): Promise<ConfirmationPage> {
    const confirmationPage = new ConfirmationPage(page)
    await expect(
      page.getByRole('heading', { name: `Bulk user roles request ${jiraReference} has been submitted` }),
    ).toBeVisible()
    return confirmationPage
  }
}
