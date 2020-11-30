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

context('External user functionality', () => {
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

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    results.edit('AUTH_ADM')

    const userPage = AuthUserPage.verifyOnPage('Auth Adm')
    userPage.userRows().eq(0).should('contain', 'AUTH_ADM')
    userPage.userRows().eq(1).should('contain', 'auth_test2@digital.justice.gov.uk')

    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Global Search')

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

    AuthUserPage.verifyOnPage('Auth Adm')

    cy.task('stubAuthRemoveRole')
    userPage.removeRole('GLOBAL_SEARCH').click()

    cy.task('verifyRemoveRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/roles/GLOBAL_SEARCH')
    })
  })

  it('Should display message if no roles to add', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthAssignableRoles', [])
    cy.visit('/manage-external-users/AUTH_RO_USER_TEST/select-roles')
    const addRole = AuthUserAddRolePage.verifyOnPage()
    addRole.noRoles().should('contain', 'There are no roles available for you to assign.')
  })
})
