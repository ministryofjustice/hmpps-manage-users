import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ChangeGroupNamePage extends AbstractPage {
  readonly header: Locator

  readonly groupName: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, title: string) {
    super(page)
    this.header = page.getByRole('heading', { name: title })
    this.groupName = this.textBox(title)
    this.submit = this.button('Confirm')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, title: string): Promise<ChangeGroupNamePage> {
    const changeGroupNamePage = new ChangeGroupNamePage(page, title)
    await expect(changeGroupNamePage.header).toBeVisible()
    return changeGroupNamePage
  }
}
