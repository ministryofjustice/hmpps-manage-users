import { expect, type Locator, type Page } from '@playwright/test'

export default class AbstractPage {
  readonly page: Page

  /** user name that appears in header */
  readonly usersName: Locator

  /** phase banner that appears in header */
  readonly phaseBanner: Locator

  /** active caseload that appears in header */
  readonly activeLocation: Locator

  /** change caseload link that appears in header */
  readonly changeLocationLink: Locator

  /** link to sign out */
  readonly signoutLink: Locator

  /** link to manage user details */
  readonly manageUserDetails: Locator

  /** button that opens the header's account menu (Your account / Switch account / Sign out) */
  readonly accountMenuButton: Locator

  protected constructor(page: Page) {
    this.page = page
    this.phaseBanner = page.getByTestId('header-phase-banner')
    this.activeLocation = page.getByTestId('active-location')
    this.changeLocationLink = page.getByTestId('change-location-link')
    this.usersName = page.getByTestId('header-user-name')
    this.signoutLink = page.getByText('Sign out')
    this.manageUserDetails = page.getByTestId('manageDetails')
    this.accountMenuButton = page.getByTestId('accountMenuButton')
  }

  /** opens the header's account menu so its links become visible/clickable */
  async openAccountMenu() {
    await expect(this.accountMenuButton).toBeVisible()
    await this.accountMenuButton.click()
    await expect(this.accountMenuButton).toHaveAttribute('aria-expanded', 'true')
  }

  async signOut() {
    await this.openAccountMenu()
    await this.signoutLink.first().click()
  }

  async clickManageUserDetails() {
    await this.openAccountMenu()
    await this.manageUserDetails.first().click()
  }

  button(text: string): Locator {
    return this.page.getByRole('button', { name: text })
  }

  radioButton(text: string, exact: boolean = false): Locator {
    return this.page.getByRole('radio', { name: text, exact })
  }

  checkbox(text: string, exact: boolean = false): Locator {
    return this.page.getByRole('checkbox', { name: text, exact })
  }

  textBox(text: string): Locator {
    return this.page.getByRole('textbox', { name: text })
  }

  link(text: string, exact: boolean = false): Locator {
    return this.page.getByRole('link', { name: text, exact })
  }

  select(text: string): Locator {
    return this.page.getByLabel(text)
  }
}
