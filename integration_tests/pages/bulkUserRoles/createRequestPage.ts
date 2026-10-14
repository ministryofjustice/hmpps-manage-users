import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class CreateRequestPage extends AbstractPage {
  readonly header: Locator

  readonly jiraReferenceInput: Locator

  readonly submitJiraReference: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Change user roles in bulk' })
    this.jiraReferenceInput = page.locator('#jira-reference-input')
    this.submitJiraReference = page.locator('#submit-jira-reference')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<CreateRequestPage> {
    const createRequestPage = new CreateRequestPage(page)
    await expect(createRequestPage.header).toBeVisible()
    return createRequestPage
  }

  static async goTo(page: Page): Promise<CreateRequestPage> {
    await page.goto(paths.bulkUserRoles.create.root.pattern)
    return CreateRequestPage.verifyOnPage(page)
  }
}
