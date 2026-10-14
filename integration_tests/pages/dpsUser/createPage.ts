import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { userTypeDisplay, UserTypeKey } from '../../../server/presentation/userType'

export default class CreatePage extends AbstractPage {
  readonly header: Locator

  readonly username: Locator

  readonly email: Locator

  readonly firstName: Locator

  readonly lastName: Locator

  readonly caseload: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, userType: UserTypeKey) {
    super(page)
    this.header = page.getByRole('heading', { name: `Create a DPS ${userTypeDisplay(userType)} user` })
    this.username = this.textBox('Username')
    this.email = this.textBox('Email address')
    this.firstName = this.textBox('First name')
    this.lastName = this.textBox('Last name')
    this.caseload = page.locator('#defaultCaseloadId')
    this.submit = this.button('Create')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, userType: UserTypeKey): Promise<CreatePage> {
    const createPage = new CreatePage(page, userType)
    await expect(createPage.header).toBeVisible()
    return createPage
  }
}
