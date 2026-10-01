import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class AddUserCaseloadPage extends AbstractPage {
  readonly header: Locator

  readonly confirmButton: Locator

  readonly cancelButton: Locator

  readonly noCaseloads: Locator

  readonly bannerMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Select caseloads' })
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.noCaseloads = page.getByTestId('no-caseloads')
    this.bannerMessage = page.getByTestId('banner-message')
  }

  choose = async (caseloadName: string) => {
    await this.checkbox(caseloadName).click()
  }

  static async verifyOnPage(page: Page): Promise<AddUserCaseloadPage> {
    const addUserCaseloadPage = new AddUserCaseloadPage(page)
    await expect(addUserCaseloadPage.header).toBeVisible()
    return addUserCaseloadPage
  }
}
