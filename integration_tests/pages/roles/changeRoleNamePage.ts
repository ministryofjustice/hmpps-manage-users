import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ChangeRoleNamePage extends AbstractPage {
  readonly header: Locator

  readonly roleName: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, roleName: string) {
    super(page)
    const title = `Change role name for ${roleName}`
    this.header = page.getByRole('heading', { name: title })
    this.roleName = this.textBox(title)
    this.submit = this.button('Confirm')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, roleName: string): Promise<ChangeRoleNamePage> {
    const changeRoleNamePage = new ChangeRoleNamePage(page, roleName)
    await expect(changeRoleNamePage.header).toBeVisible()
    return changeRoleNamePage
  }
}
