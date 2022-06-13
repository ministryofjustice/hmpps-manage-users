const MenuPage = require('../pages/menuPage')
const UserPage = require('../pages/userPage')
const DpsUserCreatePage = require('../pages/dpsUserCreatePage')
const DpsUserSelectCreatePage = require('../pages/dpsSelectUserCreatePage')
const DpsUserCreateSuccessPage = require('../pages/dpsUserCreateSuccessPage')

function goToCreateDpsUser(userType) {
  cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()

  menuPage.createDpsUser()

  const createPage = DpsUserSelectCreatePage.verifyOnPage()
  cy.task('stubDpsGetCaseloads')
  createPage.userTypeRadioButton(userType).click()
  createPage.submit().click()
  return DpsUserCreatePage.verifyOnPage(`Create a DPS ${userType} user`)
}

context('DPS user create functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show DPS Central Admin user create page if user type selected', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Central Admin')
    dpsUserCreatePage.caseloadField().should('not.exist')
  })
  it('Should show DPS General user create page if user type selected', () => {
    const dpsUserCreatePage = goToCreateDpsUser('General')
    dpsUserCreatePage.caseloadField().should('not.be.null')
  })
  it('Should show DPS Local Admin user create page if user type selected', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.caseloadField().should('not.be.null')
  })

  it('Should show errors if no data selected', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = DpsUserCreatePage.verifyOnPage(
      'Create a DPS Local System Administrator (LSA) user',
    )
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a username')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter an email address')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a first name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a last name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Select a default caseload')
  })

  it('Should create a user', () => {
    cy.task('stubDpsCreateLocalAdminUser')
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.create(
      'USER_LAA',
      'test.localadminuser@digital.justice.gov.uk',
      'firstlaa',
      'lastlaa',
      'Moorland (HMP & YOI)',
    )

    cy.task('verifyDpsCreateLocalAdminUser').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({
        userType: 'DPS_LSA', // don't need to send this
        username: 'USER_LAA',
        email: 'test.localadminuser@digital.justice.gov.uk',
        firstName: 'firstlaa',
        lastName: 'lastlaa',
        defaultCaseloadId: 'MDI',
      })
    })
    cy.task('stubEmail', { email: 'test.localadminuser@digital.justice.gov.uk', verified: false })
    cy.task('stubDpsUserGetRoles')
    cy.task('stubUserDetails')
    cy.task('stubSyncDpsEmail')
    const successPage = DpsUserCreateSuccessPage.verifyOnPage()
    successPage.email().should('contain.text', 'test.localadminuser@digital.justice.gov.uk')
    successPage.userDetailsLink().click()
    UserPage.verifyOnPage('Itag User') // stub returns this first and last name
  })
})
