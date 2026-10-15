import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateLinkedSuccessPage extends AbstractPage {
  readonly header: Locator

  readonly userDetailsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: `DPS user created` })
    this.userDetailsLink = page.getByTestId('user-details')
  }

  static async verifyOnPage(page: Page): Promise<CreateLinkedSuccessPage> {
    const createLinkedSuccessPage = new CreateLinkedSuccessPage(page)
    await expect(createLinkedSuccessPage.header).toBeVisible()
    return createLinkedSuccessPage
  }
}
