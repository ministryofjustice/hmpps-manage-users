const MenuPage = require('../../pages/menuPage')
const AuthUserSearchPage = require('../../pages/authUserSearchPage')
const AuthUserSearchResultsPage = require('../../pages/authUserSearchResultsPage')
const AuthUserPage = require('../../pages/authUserPage')
const AuthUserAddRolePage = require('../../pages/authUserAddRolePage')

function searchForUser() {
  cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
  cy.login()
  const menuPage = MenuPage.verifyOnPage()
  menuPage.manageAuthUsers().click()
  const search = AuthUserSearchPage.verifyOnPage()

  cy.task('stubAuthUsernameSearch')
  search.search('sometext')

  const results = AuthUserSearchResultsPage.verifyOnPage()
  results.user().should('have.value', 'sometext')
  results.rows().should('have.length', 2)
  return results
}

context('Auth User functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should allow a user search and display results', () => {
    const results = searchForUser()

    // ensure blank search displays error message
    results.search()
    results.errorSummary().should('contain', 'Enter a username or email address')

    cy.task('stubAuthEmailSearch')
    results.search('sometext@somewhere.com')

    results.rows().should('have.length', 3)
    results.rows().eq(1).should('contain', 'Auth Adm')
    results.rows().eq(2).should('contain', 'Auth Expired')

    results.errorSummary().should('not.exist')
  })

  it('Should add and remove a role from a user', () => {
    const results = searchForUser()

    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    cy.server()
    cy.route({ method: 'GET', url: '/api/auth-user-get?username=AUTH_ADM' }).as('getUser')
    results.edit('AUTH_ADM')

    cy.wait('@getUser')
    const userPage = AuthUserPage.verifyOnPage('Auth Adm')
    userPage.userRows().eq(1).should('contain', 'Auth Adm')
    userPage.userRows().eq(2).should('contain', 'auth_test2@digital.justice.gov.uk')

    userPage.roleRows().should('have.length', 3)
    userPage.roleRows().eq(1).should('contain', 'Global Search')

    cy.task('stubAuthAssignableRoles')
    userPage.addRole().click()
    const addRole = AuthUserAddRolePage.verifyOnPage()

    cy.task('stubAuthAddRoles')
    addRole.choose('LICENCE_VARY')
    addRole.choose('LICENCE_RO')
    addRole.addRoleButton().click()

    cy.task('verifyAddRoles').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal(['LICENCE_RO', 'LICENCE_VARY'])
    })

    cy.wait('@getUser')
    AuthUserPage.verifyOnPage('Auth Adm')

    cy.task('stubAuthRemoveRole')
    cy.route({ method: 'GET', url: '/api/auth-user-roles-remove?username=AUTH_ADM&role=GLOBAL_SEARCH' }).as(
      'removeRole'
    )
    userPage.removeRole('GLOBAL_SEARCH').click()
    cy.wait('@removeRole').should('have.property', 'status', 200)
  })

  it('Should display message if no roles to add', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthUsernameSearch')
    cy.task('stubAuthAssignableRoles', [])
    cy.visit('/manage-auth-users/AUTH_RO_USER_TEST/select-roles')
    const addRole = AuthUserAddRolePage.verifyOnPage()
    addRole.noRoles().should('contain', 'There are no roles available for you to assign.')
  })
})
