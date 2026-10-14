import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class AddUserAllowListPage extends AbstractPage {
  readonly header: Locator

  readonly username: Locator

  readonly email: Locator

  readonly firstName: Locator

  readonly lastName: Locator

  readonly reason: Locator

  readonly approver: Locator

  readonly continue: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Add user to allow list' })
    this.username = this.textBox('Username')
    this.email = this.textBox('Email address')
    this.firstName = this.textBox('First name')
    this.lastName = this.textBox('Last name')
    this.reason = this.textBox('Reason')
    this.approver = this.textBox('Who is the approving manager?')
    this.continue = this.button('Continue')
    this.submit = this.button('Add')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<AddUserAllowListPage> {
    const addUserPage = new AddUserAllowListPage(page)
    await expect(addUserPage.header).toBeVisible()
    return addUserPage
  }

  accessPeriodRadio(label: string): Locator {
    return this.radioButton(label)
  }

  async selectUserType(userType: string): Promise<AddUserAllowListPage> {
    await this.radioButton(userType).click()
    await this.continue.click()
    return this
  }
}
