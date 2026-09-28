import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { fillAutocompleteSelect } from '../../testUtils'

export default class SearchExternalUserPage extends AbstractPage {
  readonly header: Locator

  readonly filter: Locator

  readonly filterButton: Locator

  readonly userFilterInput: Locator

  readonly statusAllRadio: Locator

  readonly statusActiveRadio: Locator

  readonly statusInactiveRadio: Locator

  readonly groupFilter: Locator

  readonly roleFilter: Locator

  readonly userTableCells: Locator

  readonly paginationResults: Locator

  readonly noResults: Locator

  readonly downloadButton: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: /Search for an external user/ })
    this.filter = page.locator('.moj-filter')
    this.filterButton = this.button('Apply filters')
    this.userFilterInput = this.textBox('Name, username or email address')
    this.statusAllRadio = this.radioButton('All', true)
    this.statusActiveRadio = this.radioButton('Active', true)
    this.statusInactiveRadio = this.radioButton('Inactive')
    this.groupFilter = page.locator('#groupCode')
    this.roleFilter = page.locator('#roleCode')
    this.userTableCells = page.getByRole('cell')
    this.paginationResults = page.locator('.moj-pagination__results').first()
    this.noResults = page.getByTestId('no-results')
    this.downloadButton = this.button('Download results')
  }

  userDetailsLink(username: string): Locator {
    return this.page.getByTestId(`edit-button-${username}`)
  }

  filterCategoryLink(text: string, exact: boolean = false): Locator {
    return this.link(`Remove this filter ${text}`, exact)
  }

  paginationPageLink(page: number): Locator {
    return this.link(`Page ${page}`, true).first()
  }

  async filterAll() {
    await this.userFilterInput.fill('Andy')
    await this.statusActiveRadio.click()
    await fillAutocompleteSelect(this.groupFilter, 'PECS Court Southend Combined Court')
    await fillAutocompleteSelect(this.roleFilter, 'Licence Vary')
    await this.filterButton.click()
  }

  async filterGroup(groupName: string) {
    await fillAutocompleteSelect(this.groupFilter, groupName)
    await this.filterButton.click()
  }

  async filterRole(roleName: string) {
    await fillAutocompleteSelect(this.roleFilter, roleName)
    await this.filterButton.click()
  }

  static async verifyOnPage(page: Page): Promise<SearchExternalUserPage> {
    const searchPage = new SearchExternalUserPage(page)
    await expect(searchPage.header).toBeVisible()
    return searchPage
  }
}
