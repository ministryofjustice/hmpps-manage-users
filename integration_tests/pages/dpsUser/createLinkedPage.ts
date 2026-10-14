import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import {
  userTypeDisplay,
  userTypeExistingUsernameLabel,
  UserTypeKey,
  userTypeShorthand,
} from '../../../server/presentation/userType'

export default class CreateLinkedPage extends AbstractPage {
  readonly header: Locator

  readonly existingUsername: Locator

  readonly username: Locator

  readonly email: Locator

  readonly firstName: Locator

  readonly lastName: Locator

  readonly caseload: Locator

  readonly search: Locator

  readonly submit: Locator

  readonly cancel: Locator

  readonly errorSummary: Locator

  private constructor(page: Page, userType: UserTypeKey) {
    super(page)
    this.header = page.getByRole('heading', { name: `Create a Linked ${userTypeDisplay(userType)} user` })
    this.existingUsername = this.textBox(userTypeExistingUsernameLabel(userType))
    this.username = this.textBox(`${userTypeShorthand(userType)} Username`)
    this.email = this.textBox('Email address')
    this.firstName = this.textBox('First name')
    this.lastName = this.textBox('Last name')
    this.caseload = page.locator('#defaultCaseloadId')
    this.search = this.button(`Search`)
    this.submit = this.button(`Create and Link ${userTypeShorthand(userType)} User`)
    this.cancel = this.button('Cancel')
    this.errorSummary = page.getByTestId('error-summary')
  }

  static async verifyOnPage(page: Page, userType: UserTypeKey): Promise<CreateLinkedPage> {
    const createLinkedPage = new CreateLinkedPage(page, userType)
    await expect(createLinkedPage.header).toBeVisible()
    return createLinkedPage
  }
}
