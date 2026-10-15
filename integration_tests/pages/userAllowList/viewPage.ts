import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class ViewAllowListPage extends AbstractPage {
  readonly header: Locator

  readonly editButton: Locator

  readonly statusTag: Locator

  readonly expiry: Locator

  readonly createdDate: Locator

  readonly lastUpdatedDate: Locator

  readonly lastUpdatedBy: Locator

  readonly searchLink: Locator

  readonly approver: Locator

  private constructor(page: Page, name: string) {
    super(page)
    this.header = page.getByRole('heading', { name })
    this.editButton = page.getByTestId('edit-link')
    this.statusTag = page.getByTestId('status-tag')
    this.expiry = page.getByTestId('expiry')
    this.createdDate = page.getByTestId('created-date')
    this.lastUpdatedDate = page.getByTestId('last-updated-date')
    this.lastUpdatedBy = page.getByTestId('last-updated-by')
    this.searchLink = page.getByTestId('search-link')
    this.approver = page.getByTestId('approver')
  }

  static async verifyOnPage(page: Page, name: string): Promise<ViewAllowListPage> {
    const viewPage = new ViewAllowListPage(page, name)
    await expect(viewPage.header).toBeVisible()
    return viewPage
  }
}
