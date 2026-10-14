import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SelectUserTypePage extends AbstractPage {
  readonly header: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Create a DPS user', exact: true })
    this.submit = this.button('Continue')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<SelectUserTypePage> {
    const selectUserTypePage = new SelectUserTypePage(page)
    await expect(selectUserTypePage.header).toBeVisible()
    return selectUserTypePage
  }
}
