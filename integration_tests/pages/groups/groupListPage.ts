import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GroupListPage extends AbstractPage {
  readonly header: Locator

  readonly groupRows: Locator

  readonly noGroups: Locator

  readonly groupFilter: Locator

  readonly manageButton: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Manage groups' })
    this.groupRows = page.getByTestId('groups').getByRole('row')
    this.noGroups = page.getByTestId('no-groups')
    this.groupFilter = page.locator('#groupCode')
    this.manageButton = this.button('Manage')
    this.errorSummary = page.getByTestId('error-summary')
  }

  editLink = (groupCode: string): Locator => this.page.getByTestId(`edit-link-${groupCode}`)

  static async verifyOnPage(page: Page): Promise<GroupListPage> {
    const groupListPage = new GroupListPage(page)
    await expect(groupListPage.header).toBeVisible()
    return groupListPage
  }
}
