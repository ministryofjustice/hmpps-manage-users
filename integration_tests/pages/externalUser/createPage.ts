import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateExternalUserPage extends AbstractPage {
  readonly header: Locator

  readonly email: Locator

  readonly firstName: Locator

  readonly lastName: Locator

  readonly groupCode: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Create an external user' })
    this.email = this.textBox('Email address')
    this.firstName = this.textBox('First name')
    this.lastName = this.textBox('Last name')
    this.groupCode = page.locator('#groupCode')
    this.submit = this.button('Create')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<CreateExternalUserPage> {
    const createPage = new CreateExternalUserPage(page)
    await expect(createPage.header).toBeVisible()
    return createPage
  }
}
