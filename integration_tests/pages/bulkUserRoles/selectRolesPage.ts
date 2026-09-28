import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class SelectRolesPage extends AbstractPage {
  readonly header: Locator

  readonly inputHint: Locator

  readonly selectRolesTableRows: Locator

  readonly submitButton: Locator

  readonly backLink: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Select roles' })
    this.inputHint = page.locator('#select-roles-hint')
    this.selectRolesTableRows = page.locator('#select-roles-table tbody tr')
    this.submitButton = page.locator('#select-roles-submit')
    this.backLink = page.locator('#select-roles-back')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<SelectRolesPage> {
    const selectRolesPage = new SelectRolesPage(page)
    await expect(selectRolesPage.header).toBeVisible()
    return selectRolesPage
  }

  static async goTo(page: Page): Promise<SelectRolesPage> {
    await page.goto(paths.bulkUserRoles.create.selectRoles.pattern)
    return SelectRolesPage.verifyOnPage(page)
  }

  async selectRoles(roles: string[]) {
    await Promise.all(roles.map(role => this.page.locator(`#SELECT_${role}`).check({ force: true })))
  }

  roleCheckbox(role: string): Locator {
    return this.page.locator(`#SELECT_${role}`)
  }
}
