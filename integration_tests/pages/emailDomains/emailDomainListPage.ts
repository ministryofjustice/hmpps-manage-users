import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class EmailDomainListPage extends AbstractPage {
  readonly header: Locator

  readonly tableRows: Locator

  readonly addEmailDomainButton: Locator

  readonly noDomainsMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Manage Email Domains' })
    this.tableRows = page.getByRole('row')
    this.addEmailDomainButton = page.getByRole('button', { name: 'Add Email Domain' })
    this.noDomainsMessage = page.getByTestId('no-email-domains')
  }

  clickDeleteLink = async (domain: string) =>
    this.tableRows.filter({ hasText: domain }).getByRole('link', { name: 'Delete' }).click()

  static async verifyOnPage(page: Page): Promise<EmailDomainListPage> {
    const emailDomainListPage = new EmailDomainListPage(page)
    await expect(emailDomainListPage.header).toBeVisible()
    return emailDomainListPage
  }
}
