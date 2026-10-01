import { expect, Locator, Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { fillAutocompleteSelect } from '../../testUtils'

export default class SearchPage extends AbstractPage {
  readonly header: Locator

  readonly filter: Locator

  readonly filterButton: Locator

  readonly userFilterInput: Locator

  readonly statusAllRadio: Locator

  readonly statusActiveRadio: Locator

  readonly statusInactiveRadio: Locator

  readonly showLsaOnlyCheckbox: Locator

  readonly activeCaseloadOnlyYesRadio: Locator

  readonly activeCaseloadOnlyNoRadio: Locator

  readonly caseload: Locator

  readonly roleSearch: Locator

  readonly rolesSelectedCounter: Locator

  readonly rolesAllMatchRadio: Locator

  readonly rolesAnyMatchRadio: Locator

  readonly userTableCells: Locator

  readonly paginationResults: Locator

  readonly downloadButton: Locator

  readonly downloadLsaButton: Locator

  readonly downloadLimitExceededMessage: Locator

  readonly downloadLimitLsaExceededMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Search for a DPS user' })
    this.filter = page.locator('.moj-filter')
    this.filterButton = this.button('Apply filters')
    this.userFilterInput = this.textBox('Name, username or email address')
    this.statusAllRadio = this.radioButton('All', true)
    this.statusActiveRadio = this.radioButton('Active', true)
    this.statusInactiveRadio = this.radioButton('Inactive')
    this.showLsaOnlyCheckbox = this.checkbox('Local System Administrators only')
    this.activeCaseloadOnlyYesRadio = this.radioButton('Yes')
    this.activeCaseloadOnlyNoRadio = this.radioButton('No')
    this.caseload = page.locator('#groupCode')
    this.roleSearch = page.locator('#roleCode-search')
    this.rolesSelectedCounter = page.locator('#roleCode-total-search-counter')
    this.rolesAllMatchRadio = this.radioButton('All selected roles')
    this.rolesAnyMatchRadio = this.radioButton('Any of the selected roles')
    this.userTableCells = page.getByRole('cell')
    this.paginationResults = page.locator('.moj-pagination__results').first()
    this.downloadButton = this.button('Download results')
    this.downloadLsaButton = this.button('Download LSA report')
    this.downloadLimitExceededMessage = page.getByTestId('exceed-download-limit')
    this.downloadLimitLsaExceededMessage = page.getByTestId('exceed-download-lsa-limit')
  }

  async searchRole(searchTerm: string) {
    await this.roleSearch.clear()
    await this.roleSearch.pressSequentially(searchTerm)
  }

  userDetailsLink(username: string): Locator {
    return this.page.getByTestId(`edit-button-${username}`)
  }

  async filterAll(isAdmin: boolean = true) {
    await this.userFilterInput.fill('Andy')
    await this.statusActiveRadio.click()
    if (isAdmin) {
      await fillAutocompleteSelect(this.caseload, 'Moorland')
    }
    await this.checkbox('User Admin').click()
    await this.showLsaOnlyCheckbox.click()
    await this.rolesAnyMatchRadio.click()
    await this.filterButton.click()
  }

  filterCategoryLink(text: string, exact: boolean = false): Locator {
    return this.link(`Remove this filter ${text}`, exact)
  }

  paginationPageLink(page: number): Locator {
    return this.link(`Page ${page}`, true).first()
  }

  static async verifyOnPage(page: Page): Promise<SearchPage> {
    const createPage = new SearchPage(page)
    await expect(createPage.header).toBeVisible()
    return createPage
  }
}
