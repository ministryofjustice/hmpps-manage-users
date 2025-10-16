import { parse } from 'csv-parse'
import GroupSelectionPage from '../../pages/typescript/crsGroupSelection/groupSelectionPage'
import paths from '../../../backend/routes/paths'

context('Download CRS Group members', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [{ roleCode: 'CONTRACT_MANAGER_VIEW_GROUP' }] })
    cy.task('stubCRSGroups', {})
    cy.signIn()
  })

  it('shows a CRS group drop down list when no CRS group query parameter present', () => {
    GroupSelectionPage.goto().verifyCRSGroupSelectorDisplayed()
  })

  it('shows continue button when no CRS group query parameter present', () => {
    GroupSelectionPage.goto().verifyCRSGroupContinueButtonDisplayed()
  })

  it('should not show selected group when no CRS group query parameter present', () => {
    GroupSelectionPage.goto().verifySelectedGroupNotVisible()
  })

  it('should not show download button when no CRS group query parameter present', () => {
    GroupSelectionPage.goto().verifyDownloadButtonNotVisible()
  })

  it('should not show CRS group selector when CRS group query parameter present', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto('INT_CR_PRJ_5549').verifyCRSGroupSelectorNotVisible()
  })

  it('should not show continue button when CRS group query parameter present', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto('INT_CR_PRJ_5549').verifyContinueButtonNotVisible()
  })

  it('should show selected group when CRS group query parameter present', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto('INT_CR_PRJ_5549').verifySelectedGroupVisible()
  })

  it('should show download button when CRS group query parameter present', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto('INT_CR_PRJ_5549').verifyDownloadButtonVisible()
  })

  it('should display selected group download page on continue after group selection', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto()
      .selectGroup('INT_CR_PRJ_6158')
      .clickContinue()
      .verifySelectedGroupValueDisplayed('CRS Accommodation Services - Dyfed-Powys')
  })

  it('should go back to group selection on change group after continue', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto()
      .selectGroup('INT_CR_PRJ_6158')
      .clickContinue()
      .clickChangeGroup()
      .verifyCRSGroupSelectorDisplayed()
  })

  it('should go back to group selection on attempt to access with non CRS group', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    GroupSelectionPage.goto('INVALID_GROUP')
      .verifyCRSGroupSelectorDisplayed()
      .verifyCRSGroupContinueButtonDisplayed()
      .verifyInvalidGroupErrorMessageVisible()
  })

  it('should display CRS group drop down containing only CRS groups', () => {
    GroupSelectionPage.goto().verifyDropDownContainsOnlyCRSGroups()
  })

  it('should display message and suppress download button when selected group contains no users on continue after group selection', () => {
    cy.task('stubEmptyCRSGroupSelected', {})
    GroupSelectionPage.goto()
      .selectGroup('INT_CR_PRJ_6158')
      .clickContinue()
      .verifyDownloadButtonNotVisible()
      .verifyEmptyGroupMessageVisible()
  })

  it('should download the csv with the correct records', () => {
    cy.task('stubCRSGroupMembersSearch', {})
    cy.intercept({
      pathname: `${paths.crsGroupSelection.download({})}`,
      query: {
        group: 'INT_CR_PRJ_6166',
      },
    }).as('csvDownload')
    GroupSelectionPage.goto().selectGroup('INT_CR_PRJ_6166').clickContinue().clickDownload()
    cy.wait('@csvDownload')
      .its('request')
      .then((req) => {
        cy.request(req).then(({ body, headers }) => {
          expect(headers).to.have.property('content-type', 'text/csv; charset=utf-8')
          parse(body, {}, (err, output) => {
            expect(output, 'number of records').to.have.length(2)
            expect(output[0], 'header row').to.deep.equal(['email', 'enabled', 'firstName', 'lastName'])
            expect(output[1], 'first row').to.deep.equal([`auth_test2@digital.justice.gov.uk`, `true`, `Auth`, `Adm`])
          })
        })
      })
  })
})
