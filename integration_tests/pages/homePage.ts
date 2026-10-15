import { expect, type Locator, type Page } from '@playwright/test'
import AbstractPage from './abstractPage'

export default class HomePage extends AbstractPage {
  readonly header: Locator

  readonly noAdminFunctionsMessage: Locator

  readonly bannerMessage: Locator

  readonly tileList: Locator

  private constructor(page: Page) {
    super(page)
    this.header = page.getByRole('heading', { name: 'Manage user accounts' })
    this.noAdminFunctionsMessage = page.getByTestId('no-admin-functions-message')
    this.bannerMessage = page.getByTestId('banner-message')
    this.tileList = page.getByTestId('tile-list')
  }

  static async verifyOnPage(page: Page): Promise<HomePage> {
    const homePage = new HomePage(page)
    await expect(homePage.header).toBeVisible()
    return homePage
  }

  async verifyTileCount(count: number): Promise<HomePage> {
    const tileItems = this.tileList.getByRole('listitem')
    await expect(tileItems).toHaveCount(count)
    return this
  }

  async verifyTile(title: string, description: string, href: string, dataQa: string): Promise<HomePage> {
    const tileLocator = this.getTile(dataQa)
    const h2Locator = tileLocator.getByRole('heading', { level: 2 })
    const linkLocator = tileLocator.getByRole('link')
    const descriptionLocator = tileLocator.getByRole('paragraph')
    await expect(linkLocator).toHaveAttribute('href', href)
    await expect(h2Locator).toHaveText(title)
    await expect(linkLocator).toHaveText(title)
    await expect(descriptionLocator).toHaveText(description)
    return this
  }

  async verifyTileNotShown(dataQa: string): Promise<HomePage> {
    await expect(this.getTile(dataQa)).not.toBeVisible()
    return this
  }

  private getTile = (dataQa: string) => {
    return this.page.getByTestId(dataQa)
  }

  async selectTile(dataQa: string) {
    await this.getTile(dataQa).click()
  }
}
