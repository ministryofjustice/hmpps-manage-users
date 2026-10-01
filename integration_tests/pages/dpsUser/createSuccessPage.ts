import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateSuccessPage extends AbstractPage {
  readonly header: Locator

  readonly email: Locator

  readonly userDetailsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: `DPS user created` })
    this.email = page.getByTestId('email')
    this.userDetailsLink = page.getByTestId('user-details')
  }

  static async verifyOnPage(page: Page): Promise<CreateSuccessPage> {
    const createSuccessPage = new CreateSuccessPage(page)
    await expect(createSuccessPage.header).toBeVisible()
    return createSuccessPage
  }
}
