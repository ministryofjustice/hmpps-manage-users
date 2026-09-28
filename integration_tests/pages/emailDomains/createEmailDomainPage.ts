import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateEmailDomainPage extends AbstractPage {
  readonly header: Locator

  readonly domainNameTextbox: Locator

  readonly domainDescriptionTextbox: Locator

  readonly addEmailDomainButton: Locator

  readonly cancelButton: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Add Email Domain' })
    this.domainNameTextbox = this.textBox('Domain')
    this.domainDescriptionTextbox = this.textBox('Description')
    this.addEmailDomainButton = this.button('Add Email Domain')
    this.cancelButton = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<CreateEmailDomainPage> {
    const createEmailDomainPage = new CreateEmailDomainPage(page)
    await expect(createEmailDomainPage.header).toBeVisible()
    return createEmailDomainPage
  }
}
