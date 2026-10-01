import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { AdminType } from '../../../server/presentation/roles'

export default class ChangeRoleAdminTypePage extends AbstractPage {
  readonly header: Locator

  readonly extAdminCheckbox: Locator

  readonly dpsAdminCheckbox: Locator

  readonly lsaAdminCheckbox: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, roleName: string) {
    super(page)
    const title = `Change role admin type for ${roleName}`
    this.header = page.getByRole('heading', { name: title })
    this.extAdminCheckbox = this.checkbox(AdminType.EXT_ADM)
    this.dpsAdminCheckbox = this.checkbox(AdminType.DPS_ADM)
    this.lsaAdminCheckbox = this.checkbox(AdminType.DPS_LSA)
    this.submit = this.button('Confirm')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, title: string): Promise<ChangeRoleAdminTypePage> {
    const changeRoleAdminTypePage = new ChangeRoleAdminTypePage(page, title)
    await expect(changeRoleAdminTypePage.header).toBeVisible()
    return changeRoleAdminTypePage
  }
}
