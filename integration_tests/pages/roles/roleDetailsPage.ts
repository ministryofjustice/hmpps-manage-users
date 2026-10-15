import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class RoleDetailsPage extends AbstractPage {
  readonly header: Locator

  readonly headerRows: Locator

  readonly detailsRows: Locator

  readonly adminTypeHeaderRows: Locator

  readonly adminTypeRows: Locator

  readonly changeNameLink: Locator

  readonly changeDescriptionLink: Locator

  readonly changeAdminTypeLink: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, roleName: string) {
    super(page)
    this.header = page.getByRole('heading', { name: roleName })
    this.headerRows = page.getByTestId('header').getByRole('row')
    this.detailsRows = page.getByTestId('details').getByRole('row')
    this.adminTypeHeaderRows = page.getByTestId('admin-type-header').getByRole('row')
    this.adminTypeRows = page.getByTestId('admin-type').getByRole('row')
    this.changeNameLink = this.page.getByTestId(`change-role-name-link`)
    this.changeDescriptionLink = this.page.getByTestId(`change-role-description-link`)
    this.changeAdminTypeLink = this.page.getByTestId(`change-role-admintype-link`)
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, roleName: string): Promise<RoleDetailsPage> {
    const roleDetailsPage = new RoleDetailsPage(page, roleName)
    await expect(roleDetailsPage.header).toBeVisible()
    return roleDetailsPage
  }
}
