import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateExternalUserSuccessPage extends AbstractPage {
  readonly header: Locator

  readonly email: Locator

  readonly userDetailsLink: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'External user created' })
    this.email = page.getByTestId('email')
    this.userDetailsLink = page.getByTestId('user-details')
  }

  static async verifyOnPage(page: Page): Promise<CreateExternalUserSuccessPage> {
    const successPage = new CreateExternalUserSuccessPage(page)
    await expect(successPage.header).toBeVisible()
    return successPage
  }
}
