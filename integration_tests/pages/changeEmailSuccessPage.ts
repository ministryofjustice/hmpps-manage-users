import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class ChangeEmailSuccessPage extends AbstractPage {
  readonly header: Locator

  readonly email: Locator

  readonly continueButton: Locator

  constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Email address changed' })
    this.email = page.getByTestId('email')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
  }

  static async verifyOnPage(page: Page): Promise<ChangeEmailSuccessPage> {
    const createPage = new ChangeEmailSuccessPage(page)
    await expect(createPage.header).toBeVisible()
    return createPage
  }
}
