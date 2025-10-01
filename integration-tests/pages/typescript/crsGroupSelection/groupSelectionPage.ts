import Page from '../page'
import { getDataQa, selectDropdownItem, verifyDataQaText } from '../../../support/utils'

export default class GroupSelectionPage extends Page {
  constructor() {
    super(`CRS Group Selection`)
  }

  public static goto(group?: string): GroupSelectionPage {
    cy.visit('/crs-group-selection', {
      qs: {
        group,
      },
    })

    return Page.verifyOnPage(GroupSelectionPage)
  }

  verifyCRSGroupSelectorDisplayed = (): GroupSelectionPage => {
    getDataQa('crs-group-selector').should('be.visible')
    return this
  }

  verifyCRSGroupContinueButtonDisplayed = (): GroupSelectionPage => {
    getDataQa('continue-button').should('be.visible')
    return this
  }

  verifyCRSGroupSelectorNotVisible = (): GroupSelectionPage => {
    getDataQa('crs-group-selector').should('not.exist')
    return this
  }

  verifyContinueButtonNotVisible = (): GroupSelectionPage => {
    getDataQa('continue-button').should('not.exist')
    return this
  }

  verifyDownloadButtonNotVisible = (): GroupSelectionPage => {
    getDataQa('download-button').should('not.exist')
    return this
  }

  verifyDownloadButtonVisible = (): GroupSelectionPage => {
    getDataQa('download-button').should('be.visible')
    return this
  }

  verifySelectedGroupNotVisible = (): GroupSelectionPage => {
    getDataQa('selected-group-header').should('not.exist')
    getDataQa('selected-group-value').should('not.exist')
    return this
  }

  verifySelectedGroupVisible = (): GroupSelectionPage => {
    getDataQa('selected-group-header').should('be.visible')
    getDataQa('selected-group-value').should('be.visible')
    return this
  }

  selectGroup = (itemCode: string): GroupSelectionPage => {
    selectDropdownItem('crs-group-selector', itemCode)
    return this
  }

  clickContinue = (): GroupSelectionPage => {
    getDataQa('continue-button').click()
    return this
  }

  clickChangeGroup = (): GroupSelectionPage => {
    getDataQa('change-group-link').click()
    return this
  }

  verifyDropDownContainsOnlyCRSGroups = (): GroupSelectionPage => {
    getDataQa('crs-group-selector').select('INT_CR_PRJ_6166').should('contain', 'CRS Accommodation for South Wales')
    getDataQa('crs-group-selector')
      .select('INT_CR_PRJ_6158')
      .should('contain', 'CRS Accommodation Services - Dyfed-Powys')
    getDataQa('crs-group-selector')
      .select('INT_CR_PRJ_5549')
      .should('contain', 'CRS Accommodation Services - East Midlands')

    cy.get('select option:contains(CRC_C01)').should('not.exist')
    cy.get('select option:contains(CRC_C09)').should('not.exist')
    cy.get('select option:contains(CRC_C05)').should('not.exist')
    return this
  }

  verifySelectedGroupValueDisplayed = (expectedValue: string): GroupSelectionPage => {
    verifyDataQaText('selected-group-value', expectedValue)
    return this
  }

  clickDownload = () => getDataQa('download-button').click()

  verifyAccessDeniedPageDisplayed = (): GroupSelectionPage => {
    getDataQa('crs-group-selector').should('be.visible')
    return this
  }
}
