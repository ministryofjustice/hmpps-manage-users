import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import paths from '../../../server/routes/paths'

export default class UploadUsersPage extends AbstractPage {
  readonly header: Locator

  readonly fileUploadHint: Locator

  readonly chooseFile: Locator

  readonly uploadButton: Locator

  readonly backLink: Locator

  readonly errorSummary: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Upload users' })
    this.fileUploadHint = page.locator('#upload-users-file-hint')
    this.chooseFile = page.locator('input[type="file"]#upload-users-file-input')
    this.uploadButton = page.locator('#upload-users-file-upload')
    this.backLink = page.locator('#upload-users-back')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page): Promise<UploadUsersPage> {
    const uploadUsersPage = new UploadUsersPage(page)
    await expect(uploadUsersPage.header).toBeVisible()
    return uploadUsersPage
  }

  static async goTo(page: Page): Promise<UploadUsersPage> {
    await page.goto(paths.bulkUserRoles.create.uploadUsers.pattern)
    return UploadUsersPage.verifyOnPage(page)
  }
}
