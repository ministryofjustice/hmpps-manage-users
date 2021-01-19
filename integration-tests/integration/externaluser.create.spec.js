const MenuPage = require('../pages/menuPage')
const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const UserAddGroupPage = require('../pages/userAddGroupPage')
const AuthUserCreatePage = require('../pages/authUserCreatePage')

function createUser() {
  const createPage = AuthUserCreatePage.verifyOnPage()

  cy.task('stubAuthCreateUser')
  cy.task('stubAuthGetUsername')
  cy.task('stubAuthUserRoles')
  cy.task('stubAuthUserGroups')
  createPage.create('noone@justice.gov.uk', '', '', 'SOCU North West')

  cy.task('verifyAuthCreateUser').should((requests) => {
    expect(requests).to.have.lengthOf(1)

    expect(JSON.parse(requests[0].body)).to.deep.equal({
      email: 'emailnoone@justice.gov.uk',
      firstName: 'first',
      lastName: 'last',
      groupCode: 'SOC_NORTH_WEST',
    })
  })
  UserPage.verifyOnPage('Auth Adm')
}

function goToCreateUser(roleCode = 'MAINTAIN_OAUTH_USERS') {
  cy.task('stubLogin', { roles: [{ roleCode }] })
  cy.login()
  const menuPage = MenuPage.verifyOnPage()

  cy.task('stubAuthAssignableGroups', {})
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
    const createPage = goToCreateUser()
    createPage.create('email', 'first', 'last', '')

    createPage.errorSummary().should('contain.text', 'Enter an email address in the correct format')
    createUser()
  })

  it('Should create a user as a group manager', () => {
    const createPage = goToCreateUser('AUTH_GROUP_MANAGER')
    createPage.create('email', 'first', 'last', '')

    createPage.errorSummary().should('contain.text', 'Select a group')
    createUser()
  })
})
