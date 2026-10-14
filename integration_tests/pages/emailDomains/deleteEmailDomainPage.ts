import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class DeleteEmailDomainPage extends AbstractPage {
  readonly header: Locator

  readonly deleteEmailDomainButton: Locator

  readonly cancelButton: Locator

  readonly domainName: Locator

  readonly confirmDomainTextbox: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Delete Email Domain' })
    this.deleteEmailDomainButton = this.button('Delete Email Domain')
    this.cancelButton = this.button('Cancel')
    this.domainName = page.getByTestId('domain-name')
    this.confirmDomainTextbox = this.textBox('Are you sure you want to delete this domain?')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<DeleteEmailDomainPage> {
    const deleteEmailDomainPage = new DeleteEmailDomainPage(page)
    await expect(deleteEmailDomainPage.header).toBeVisible()
    return deleteEmailDomainPage
  }
}
