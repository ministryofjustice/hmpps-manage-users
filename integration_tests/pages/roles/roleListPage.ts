import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from '../abstractPage'
import { adminTypeShorthand } from '../../../server/presentation/roles'

export default class RoleListPage extends AbstractPage {
  readonly header: Locator

  readonly filter: Locator

  readonly filterButton: Locator

  readonly roleNameInput: Locator

  readonly roleCodeInput: Locator

  readonly adminTypeAllRadio: Locator

  readonly adminTypeExtAdminRadio: Locator

  readonly adminTypeDpsAdminRadio: Locator

  readonly adminTypeDpsLsaRadio: Locator

  readonly roleTableCells: Locator

  readonly paginationResults: Locator

  readonly noResultsMessage: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Manage roles' })
    this.filter = page.locator('.moj-filter')
    this.filterButton = this.button('Apply filters')
    this.roleNameInput = this.textBox('Role name')
    this.roleCodeInput = this.textBox('Role code')
    this.adminTypeAllRadio = this.radioButton('All', true)
    this.adminTypeExtAdminRadio = this.radioButton(adminTypeShorthand('EXT_ADM'))
    this.adminTypeDpsAdminRadio = this.radioButton(adminTypeShorthand('DPS_ADM'))
    this.adminTypeDpsLsaRadio = this.radioButton(adminTypeShorthand('DPS_LSA'))
    this.roleTableCells = page.getByRole('cell')
    this.paginationResults = page.locator('.moj-pagination__results').first()
    this.noResultsMessage = page.getByTestId('no-results')
  }

  filterCategoryLink(text: string, exact: boolean = false): Locator {
    return this.link(`Remove this filter ${text}`, exact)
  }

  paginationPageLink(page: number): Locator {
    return this.link(`Page ${page}`, true).first()
  }

  roleDetailsLink(roleCode: string): Locator {
    return this.page.getByTestId(`edit-button-${roleCode}`)
  }

  static async verifyOnPage(page: Page): Promise<RoleListPage> {
    const authErrorPage = new RoleListPage(page)
    await expect(authErrorPage.header).toBeVisible()
    return authErrorPage
  }
}
