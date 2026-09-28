import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class EditAllowListPage extends AbstractPage {
  readonly header: Locator

  readonly reason: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  readonly statusTag: Locator

  readonly username: Locator

  readonly email: Locator

  readonly firstName: Locator

  readonly lastName: Locator

  readonly existingReason: Locator

  readonly approver: Locator

  private constructor(page: Page, name: string) {
    super(page)
    this.header = page.getByRole('heading', { name })
    this.reason = this.textBox('Reason')
    this.submit = this.button('Update')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
    this.statusTag = page.getByTestId('status-tag')
    this.username = page.getByTestId('username')
    this.email = page.getByTestId('email')
    this.firstName = page.getByTestId('firstName')
    this.lastName = page.getByTestId('lastName')
    this.existingReason = page.getByTestId('reason')
    this.approver = page.getByTestId('approver')
  }

  static async verifyOnPage(page: Page, name: string): Promise<EditAllowListPage> {
    const editPage = new EditAllowListPage(page, name)
    await expect(editPage.header).toBeVisible()
    return editPage
  }

  accessPeriodRadio(label: string): Locator {
    return this.radioButton(label)
  }
}
