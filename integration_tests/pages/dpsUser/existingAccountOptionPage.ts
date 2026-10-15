import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { userTypeDisplay, UserTypeKey } from '../../../server/presentation/userType'

export default class ExistingAccountOptionPage extends AbstractPage {
  readonly header: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, userType: UserTypeKey) {
    super(page)
    this.header = page.getByRole('heading', { name: `Create a DPS ${userTypeDisplay(userType)} user` })
    this.submit = this.button('Continue')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, userType: UserTypeKey): Promise<ExistingAccountOptionPage> {
    const existingAccountOptionPage = new ExistingAccountOptionPage(page, userType)
    await expect(existingAccountOptionPage.header).toBeVisible()
    return existingAccountOptionPage
  }
}
