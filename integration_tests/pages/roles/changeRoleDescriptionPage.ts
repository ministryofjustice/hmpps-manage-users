import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ChangeRoleDescriptionPage extends AbstractPage {
  readonly header: Locator

  readonly roleDescription: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, roleName: string) {
    super(page)
    const title = `Change role description for ${roleName}`
    this.header = page.getByRole('heading', { name: title })
    this.roleDescription = this.textBox(title)
    this.submit = this.button('Confirm')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, roleName: string): Promise<ChangeRoleDescriptionPage> {
    const changeRoleDescriptionPage = new ChangeRoleDescriptionPage(page, roleName)
    await expect(changeRoleDescriptionPage.header).toBeVisible()
    return changeRoleDescriptionPage
  }
}
