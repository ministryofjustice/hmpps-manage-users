import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RequestRoleRemovalPage extends AbstractPage {
  readonly header: Locator

  readonly removalMessage: Locator

  readonly continueButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Request role removal' })
    this.removalMessage = page.getByTestId('removal-message')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<RequestRoleRemovalPage> {
    const requestRoleRemovalPage = new RequestRoleRemovalPage(page)
    await expect(requestRoleRemovalPage.header).toBeVisible()
    return requestRoleRemovalPage
  }
}
