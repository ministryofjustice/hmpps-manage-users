import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'

export default class SearchAllowListPage extends AbstractPage {
  readonly header: Locator

  readonly filter: Locator

  readonly filterButton: Locator

  readonly userFilterInput: Locator

  readonly statusAllRadio: Locator

  readonly statusActiveRadio: Locator

  readonly statusExpiredRadio: Locator

  readonly statusInactiveRadio: Locator

  readonly userTypeAllRadio: Locator

  readonly userTypeDigitalRadio: Locator

  readonly userTypeGeneralRadio: Locator

  readonly userTableCells: Locator

  readonly paginationResults: Locator

  readonly noResults: Locator

  readonly downloadButton: Locator

  readonly downloadLimitExceededMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Search the Test allow list' })
    this.filter = page.locator('.moj-filter')
    this.filterButton = this.button('Apply filters')
    this.userFilterInput = this.textBox('Name, username or email address')
    this.statusAllRadio = page.locator('input[name="status"][value="ALL"]')
    this.statusActiveRadio = this.radioButton('Active', true)
    this.statusExpiredRadio = this.radioButton('Expired')
    this.statusInactiveRadio = this.statusExpiredRadio
    this.userTypeAllRadio = page.locator('input[name="userType"][value="ALL"]')
    this.userTypeDigitalRadio = this.radioButton('Digital', true)
    this.userTypeGeneralRadio = this.radioButton('General')
    this.userTableCells = page.getByRole('cell')
    this.paginationResults = page.locator('.moj-pagination__results').first()
    this.noResults = page.getByTestId('no-results')
    this.downloadButton = this.button('Download results')
    this.downloadLimitExceededMessage = page.getByTestId('exceed-download-limit')
  }

  userDetailsLink(username: string): Locator {
    return this.page.getByTestId(`edit-button-${username}`)
  }

  viewDetailsLink(username: string): Locator {
    return this.page.getByTestId(`view-details-${username}`)
  }

  filterCategoryLink(text: string, exact: boolean = false): Locator {
    return this.link(`Remove this filter ${text}`, exact)
  }

  paginationPageLink(page: number): Locator {
    return this.link(`Page ${page}`, true).first()
  }

  static async verifyOnPage(page: Page): Promise<SearchAllowListPage> {
    const searchPage = new SearchAllowListPage(page)
    await expect(searchPage.header).toBeVisible()
    return searchPage
  }
}
