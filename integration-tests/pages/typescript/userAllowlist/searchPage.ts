import Page from '../page'
import config from '../../../../backend/config'
import { getDataQa, getFormField, getRadio, isChecked, typeOrClear } from '../../../support/utils'
import { SearchAllowlistUserParams } from '../../../mockApis/manageUsersAllowList'

export default class SearchPage extends Page {
  constructor() {
    super(`Search the ${config.featureSwitches.manageUserAllowList.environmentLabel} allow list`)
  }

  public static goto(params: SearchAllowlistUserParams): SearchPage {
    cy.task('stubSearchAllowlistUser', params)
    cy.visit('/user-allow-list')
    return Page.verifyOnPage(SearchPage)
  }

  fillUserFilter = (text?: string): SearchPage => {
    typeOrClear(getFormField('user'), text)
    return this
  }

  verifyStatusFilter = (label: string): SearchPage => {
    isChecked(getRadio(label))
    return this
  }

  selectStatusFilter = (label: string): SearchPage => {
    getRadio(label).click()
    return this
  }

  verifyDownloadDisplayed = (isShown: boolean): SearchPage => {
    if (isShown) {
      getDataQa('download').should('be.visible')
    } else {
      getDataQa('exceed-download-limit').should('be.visible')
    }
    return this
  }

  clickDownload = () => getDataQa('download').click()

  clickApplyFilter = () => getDataQa('apply-filter-button').click()

  clickEditLink = (username: string) => getDataQa(`edit-button-${username}`).click()

  clickViewDetails = (username: string) => getDataQa(`view-details-${username}`).click()
}
