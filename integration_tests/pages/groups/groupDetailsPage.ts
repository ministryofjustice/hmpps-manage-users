import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class GroupDetailsPage extends AbstractPage {
  readonly header: Locator

  readonly headerRows: Locator

  readonly detailsRows: Locator

  readonly assignableRolesRows: Locator

  readonly childGroupRows: Locator

  readonly createChildGroupButton: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, groupName: string) {
    super(page)
    this.header = page.getByRole('heading', { name: groupName })
    this.headerRows = page.getByTestId('header').getByRole('row')
    this.detailsRows = page.getByTestId('details').getByRole('row')
    this.assignableRolesRows = page.getByTestId('assignable-roles').getByRole('row')
    this.childGroupRows = page.getByTestId('child-groups').getByRole('row')
    this.createChildGroupButton = this.button('Create child group')
    this.errorSummary = page.getByTestId('error-summary')
  }

  changeNameLink = (groupCode: string): Locator => this.page.getByTestId(`change-name-${groupCode}`)

  deleteLink = (groupCode: string): Locator => this.page.getByTestId(`delete-${groupCode}`)

  static async verifyOnPage(page: Page, groupName: string): Promise<GroupDetailsPage> {
    const groupDetailsPage = new GroupDetailsPage(page, groupName)
    await expect(groupDetailsPage.header).toBeVisible()
    return groupDetailsPage
  }
}
