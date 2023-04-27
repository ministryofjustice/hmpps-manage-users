const MenuPage = require('../pages/menuPage')
const UserPage = require('../pages/userPage')
const DpsUserCreatePage = require('../pages/dpsUserCreatePage')
const DpsUserSelectCreatePage = require('../pages/dpsSelectUserCreatePage')
const DpsSelectLinkedCreateUserOptionsPage = require('../pages/dpsSelectLinkedCreateUserOptionsPage')
const DpsUserCreateSuccessPage = require('../pages/dpsUserCreateSuccessPage')
const AuthErrorPage = require('../pages/authErrorPage')

function goToCreateDpsUser(userType) {
  cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()

  menuPage.createDpsUser()

  const userSelectCreatePage = DpsUserSelectCreatePage.verifyOnPage()
  cy.task('stubDpsGetCaseloads')
  userSelectCreatePage.userTypeRadioButton(userType).click()
  userSelectCreatePage.submit().click()
  const linkUserCreateOptionsPage = DpsSelectLinkedCreateUserOptionsPage.verifyOnPage(`Create a DPS ${userType} user`)
  linkUserCreateOptionsPage.isLinkedRadioButton('No').click()
  linkUserCreateOptionsPage.submit().click()
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
    dpsUserCreatePage.caseloadLabel().should('contain.text', 'Select a default caseload')
  })

  it('Should show DPS Local Admin user create page if user type selected', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.caseloadField().should('not.be.null')
    dpsUserCreatePage.caseloadLabel().should('contain.text', 'Select a default local admin group')
  })

  it('Should show errors if no data selected for Central admin user', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Central Admin')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = DpsUserCreatePage.verifyOnPage('Create a DPS Central Admin user')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a username')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter an email address')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a first name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a last name')
    createDpsPageAfterSubmit.errorSummary().should('not.contain.text', 'Select a default')
  })
  it('Should show errors if no data selected for General user', () => {
    const dpsUserCreatePage = goToCreateDpsUser('General')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = DpsUserCreatePage.verifyOnPage('Create a DPS General user')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a username')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter an email address')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a first name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a last name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Select a default caseload')
  })

  it('Should show errors if no data selected for LSA', () => {
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = DpsUserCreatePage.verifyOnPage(
      'Create a DPS Local System Administrator (LSA) user',
    )
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a username')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter an email address')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a first name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter a last name')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Select a default local admin group')
  })

  it('Should create a user', () => {
    cy.task('stubDpsCreateUser')
    const dpsUserCreatePage = goToCreateDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.create(
      'USER_LAA',
      'test.localadminuser@digital.justice.gov.uk',
      'firstlaa',
      'lastlaa',
      'Moorland (HMP & YOI)',
    )

    cy.task('verifyDpsCreateUser').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.include({
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
    cy.task('stubUserDetails', {})
    cy.task('stubSyncDpsEmail')
    const successPage = DpsUserCreateSuccessPage.verifyOnPage()
    successPage.email().should('contain.text', 'test.localadminuser@digital.justice.gov.uk')
    successPage.userDetailsLink().click()
    UserPage.verifyOnPage('Itag User') // stub returns this first and last name
  })

  it('Should fail attempting to reach "create-user" if unauthorised', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'NOT_CREATE_USER' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createDpsUserTile().should('not.exist')

    cy.visit('/create-user', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })

  it('Should fail attempting to reach "create-dps-user" if unauthorised', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'NOT_CREATE_USER' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createDpsUserTile().should('not.exist')

    cy.visit('/create-dps-user', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })
  it('Should check for CSRF token', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }] })
    cy.task('stubDpsGetCaseloads')
    cy.signIn()

    // Attempt to submit form without CSRF token:
    cy.request({
      method: 'POST',
      url: 'create-dps-user',
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })
})
