import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class AddRolePage extends AbstractPage {
  readonly header: Locator

  readonly confirmButton: Locator

  readonly cancelButton: Locator

  readonly noRoles: Locator

  readonly bannerMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Select roles' })
    this.confirmButton = page.getByRole('button', { name: 'Confirm' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.noRoles = page.getByTestId('no-roles')
    this.bannerMessage = page.getByTestId('banner-message')
  }

  hintFor = (roleName: string): Locator => {
    const item = this.page.locator('div.govuk-checkboxes__item').filter({ hasText: roleName })
    return item.locator('div.govuk-checkboxes__hint')
  }

  choose = async (roleName: string) => {
    await this.checkbox(roleName).click()
  }

  static async verifyOnPage(page: Page): Promise<AddRolePage> {
    const addRolePage = new AddRolePage(page)
    await expect(addRolePage.header).toBeVisible()
    return addRolePage
  }
}
