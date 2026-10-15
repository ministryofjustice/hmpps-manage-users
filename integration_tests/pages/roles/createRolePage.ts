import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { AdminType } from '../../../server/presentation/roles'

export default class CreateRolePage extends AbstractPage {
  readonly header: Locator

  readonly roleCode: Locator

  readonly roleName: Locator

  readonly roleDescription: Locator

  readonly extAdminCheckbox: Locator

  readonly dpsAdminCheckbox: Locator

  readonly lsaAdminCheckbox: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Create role' })
    this.roleCode = this.textBox('Role code')
    this.roleName = this.textBox('Role name')
    this.roleDescription = this.textBox('Role description')
    this.extAdminCheckbox = this.checkbox(AdminType.EXT_ADM)
    this.dpsAdminCheckbox = this.checkbox(AdminType.DPS_ADM)
    this.lsaAdminCheckbox = this.checkbox(AdminType.DPS_LSA)
    this.submit = this.button('Create')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<CreateRolePage> {
    const createRolePage = new CreateRolePage(page)
    await expect(createRolePage.header).toBeVisible()
    return createRolePage
  }
}
