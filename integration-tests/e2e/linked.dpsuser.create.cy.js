const MenuPage = require('../pages/menuPage')
const UserPage = require('../pages/userPage')
const LinkedDpsUserCreatePage = require('../pages/linkedDpsUserCreatePage')
const DpsUserSelectCreatePage = require('../pages/dpsSelectUserCreatePage')
const DpsSelectLinkedCreateUserOptionsPage = require('../pages/dpsSelectLinkedCreateUserOptionsPage')
const LinkedDpsUserCreateSuccessPage = require('../pages/linkedDpsUserCreateSuccessPage')
const AuthErrorPage = require('../pages/authErrorPage')

function goToCreateLinkedDpsUser(userType) {
  cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()
  menuPage.createDpsUser()
  const userSelectCreatePage = DpsUserSelectCreatePage.verifyOnPage()
  cy.task('stubDpsGetCaseloads')
  userSelectCreatePage.userTypeRadioButton(userType).click()
  userSelectCreatePage.submit().click()
  const linkUserCreateOptionsPage = DpsSelectLinkedCreateUserOptionsPage.verifyOnPage(`Create a DPS ${userType} User`)
  linkUserCreateOptionsPage.isLinkedRadioButton('Yes').click()
  linkUserCreateOptionsPage.submit().click()
  return LinkedDpsUserCreatePage.verifyOnPage(`Create a Linked ${userType} User`)
}

context('DPS linked user create functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show DPS Central Admin user create page if user type selected and then linking option Yes', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('Central Admin')
    dpsUserCreatePage.caseloadField().should('not.exist')
  })

  it('Should show DPS General user create page if user type selected and then linking option Yes', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('General')
    dpsUserCreatePage.caseloadField().should('not.be.null')
    dpsUserCreatePage.caseloadLabel().should('contain.text', 'Select a default caseload')
  })

  it('Should show DPS Local Admin user create page if user type selected and then linking option Yes', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.caseloadField().should('not.be.null')
    dpsUserCreatePage.caseloadLabel().should('contain.text', 'Select a default local admin group')
  })

  it('Should show errors if no data selected for Central admin user', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('Central Admin')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = LinkedDpsUserCreatePage.verifyOnPage('Create a Linked Central Admin User')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter the existing username')
    createDpsPageAfterSubmit.errorSummary().should('not.contain.text', 'Select a default')
  })
  it('Should show errors if no data selected for General user', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('General')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = LinkedDpsUserCreatePage.verifyOnPage('Create a Linked General User')
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter the existing username')
  })

  it('Should show errors if no data selected for LSA', () => {
    const dpsUserCreatePage = goToCreateLinkedDpsUser('Local System Administrator (LSA)')
    dpsUserCreatePage.submit().click()
    const createDpsPageAfterSubmit = LinkedDpsUserCreatePage.verifyOnPage(
      'Create a Linked Local System Administrator (LSA) User',
    )
    createDpsPageAfterSubmit.errorSummary().should('contain.text', 'Enter the existing username')
  })

  it('Should create a linked Admin user', () => {
    cy.task('stubLinkedAdminDpsCreateUser')
    const linkedDpsUserCreatePage = goToCreateLinkedDpsUser('Central Admin')
    linkedDpsUserCreatePage.linkAdmin('EXISTING_USER', 'NEW_ADMIN')

    cy.task('verifyLinkedAdminDpsCreateUser').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.include({
        existingUsername: 'EXISTING_USER',
        adminUsername: 'NEW_ADMIN',
      })
    })
    LinkedDpsUserCreateSuccessPage.verifyOnPage()
  })

  it('Should fail attempting to reach "create-user" if unauthorised', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'NOT_CREATE_USER' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createDpsUserTile().should('not.exist')

    cy.visit('/create-user', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })

  it('Should fail attempting to reach "create-linked-dps-user" if unauthorised', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'NOT_CREATE_USER' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createDpsUserTile().should('not.exist')

    cy.visit('/create-linked-dps-user', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })
  it('Should check for CSRF token', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }] })
    cy.task('stubDpsGetCaseloads')
    cy.signIn()

    // Attempt to submit form without CSRF token:
    cy.request({
      method: 'POST',
      url: 'create-linked-dps-user',
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })
})
