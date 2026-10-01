import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class CreateGroupPage extends AbstractPage {
  readonly header: Locator

  readonly groupCode: Locator

  readonly groupName: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Create group' })
    this.groupCode = this.textBox('Group code')
    this.groupName = this.textBox('Group name')
    this.submit = this.button('Create')
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<CreateGroupPage> {
    const createGroupPage = new CreateGroupPage(page)
    await expect(createGroupPage.header).toBeVisible()
    return createGroupPage
  }
}
