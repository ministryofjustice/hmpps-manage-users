const MenuPage = require('../pages/menuPage')
const UserPage = require('../pages/userPage')
const AuthUserCreatePage = require('../pages/authUserCreatePage')
const AuthUserCreateSuccessPage = require('../pages/authUserCreateSuccessPage')

function createUser() {
  const createPage = AuthUserCreatePage.verifyOnPage()

  cy.task('stubExternalCreateUser')
  cy.task('stubAuthGetUsername')
  cy.task('stubExternalUserRoles')
  cy.task('stubManageUserGroups')
  createPage.create('noone@justice.gov.uk', '', '', 'SOCU North West')

  cy.task('verifyExternalCreateUser').should((requests) => {
    expect(requests).to.have.lengthOf(1)

    expect(JSON.parse(requests[0].body)).to.deep.include({
      email: 'emailnoone@justice.gov.uk',
      firstName: 'first',
      lastName: 'last',
      groupCode: 'SOC_NORTH_WEST',
    })
  })
  const successPage = AuthUserCreateSuccessPage.verifyOnPage()
  successPage.email().should('contain.text', 'emailnoone@justice.gov.uk')
  successPage.userDetailsLink().click()
  UserPage.verifyOnPage('Auth Adm')
}

function goToCreateUser(roleCodes) {
  const roles = []
  roleCodes.forEach((roleCode) => roles.push({ roleCode }))

  cy.task('stubSignIn', { roles })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()

  cy.task('stubAssignableGroups', {})
  menuPage.createAuthUser()

  return AuthUserCreatePage.verifyOnPage()
}

context('External user create functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should create a user', () => {
    const createPage = goToCreateUser(['MAINTAIN_OAUTH_USERS'])
    createPage.create('email', 'first', 'last', '')

    createPage.errorSummary().should('contain.text', 'Enter an email address in the correct format')
    createUser()
  })

  it('Should create a user as a group manager', () => {
    const createPage = goToCreateUser(['AUTH_GROUP_MANAGER'])
    createPage.create('email', 'first', 'last', '')

    createPage.errorSummary().should('contain.text', 'Select a group')
    createUser()
  })

  it('Should check for CSRF token', () => {
    goToCreateUser(['MAINTAIN_OAUTH_USERS'])

    // Attempt to submit form without CSRF token:
    cy.request({
      method: 'POST',
      url: '/create-external-user',
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })
})
