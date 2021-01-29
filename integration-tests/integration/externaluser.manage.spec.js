const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const UserAddGroupPage = require('../pages/userAddGroupPage')
const AuthUserChangeEmailPage = require('../pages/authUserChangeEmailPage')
const { searchForUser, replicateUser } = require('../support/externaluser.helpers')

const editUser = (roleCode) => {
  const results = searchForUser(roleCode)

  cy.task('stubAuthGetUsername')
  cy.task('stubAuthUserRoles')
  cy.task('stubAuthUserGroups')
  results.edit('AUTH_ADM')

  return UserPage.verifyOnPage('Auth Adm')
}

context('External user manage functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should view a user', () => {
    const userPage = editUser()

    userPage.userRows().eq(0).should('contain', 'AUTH_ADM')
    userPage.userRows().eq(1).should('contain', 'auth_test2@digital.justice.gov.uk')
    userPage.userRows().eq(0).should('contain', 'Username')
    userPage.userRows().eq(1).should('contain', 'Email')
    userPage.userRows().eq(0).should('not.contain', 'Username / email')
  })

  it('Should be able to return to search page', () => {
    const userPage = editUser()

    userPage.searchLink().click()
    AuthUserSearchPage.verifyOnPage()
  })

  it('Should view a user with username as email address', () => {
    const results = searchForUser()

    cy.task('stubAuthGetUserWithEmail')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    results.edit('AUTH_ADM')

    const userPage = UserPage.verifyOnPage('Auth Adm')
    userPage.userRows().eq(0).should('contain', 'auth_test2@digital.justice.gov.uk')
    userPage.userRows().eq(0).should('contain', 'Username / email')
  })

  it('Should add and remove a role from a user', () => {
    const userPage = editUser()

    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Global Search')

    cy.task('stubAuthAssignableRoles')
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()

    cy.task('stubAuthAddRoles')
    addRole.choose('LICENCE_VARY')
    addRole.choose('LICENCE_RO')
    addRole.addRoleButton().click()

    cy.task('verifyAddRoles').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal(['LICENCE_RO', 'LICENCE_VARY'])
    })

    UserPage.verifyOnPage('Auth Adm')

    cy.task('stubAuthRemoveRole')
    userPage.removeRole('GLOBAL_SEARCH').click()

    cy.task('verifyRemoveRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/roles/GLOBAL_SEARCH')
    })
  })

  it('Should cancel an add role', () => {
    const userPage = editUser()

    cy.task('stubAuthAssignableRoles')
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()

    addRole.cancel()
    UserPage.verifyOnPage('Auth Adm')
  })

  it('Should add and remove a group from a user', () => {
    const userPage = editUser()

    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    cy.task('stubAuthAssignableGroups', {})
    userPage.addGroup().click()
    const addGroup = UserAddGroupPage.verifyOnPage()

    cy.task('stubAuthAddGroup')
    addGroup.type('SOCU North West')
    addGroup.addGroupButton().click()

    cy.task('verifyAddGroup').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/groups/SOC_NORTH_WEST')
    })

    UserPage.verifyOnPage('Auth Adm')

    cy.task('stubAuthRemoveGroup')
    userPage.removeGroup('SITE_1_GROUP_1').click()

    cy.task('verifyRemoveGroup').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/groups/SITE_1_GROUP_1')
    })
  })

  it('Should cancel an add group', () => {
    const userPage = editUser()

    cy.task('stubAuthAssignableGroups', {})
    userPage.addGroup().click()
    const addGroup = UserAddGroupPage.verifyOnPage()

    addGroup.cancel()
    UserPage.verifyOnPage('Auth Adm')
  })

  it('Add and remove a group from a user not available for group managers', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER')

    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    userPage.addGroup().should('not.exist')
    userPage.removeGroup('SITE_1_GROUP_1').should('not.exist')
  })

  it('Should display message if no roles to add', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthAssignableRoles', [])
    cy.visit('/manage-external-users/AUTH_RO_USER_TEST/select-roles')
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.noRoles().should('contain', 'There are no roles available for you to assign.')
  })

  it('Should provide breadcrumb link back to search results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', { content: [] })
    cy.task('stubAuthSearchableRoles', { content: [] })
    cy.task('stubAuthSearch', {
      content: replicateUser(5),
      totalElements: 21,
      page: 0,
      size: 5,
    })

    const search = AuthUserSearchPage.goTo()
    search.search('sometext@somewhere.com')
    const results = UserSearchResultsPage.verifyOnPage()
    results.nextPage()

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    results.edit('AUTH_ADM4')

    const userPage = UserPage.verifyOnPage('Auth Adm')
    userPage
      .searchResultsBreadcrumb()
      .should(
        'have.attr',
        'href',
        '/search-external-users/results?user=sometext%40somewhere.com&status=ACTIVE&groupCode=&roleCode=&page=1',
      )
  })

  it('Should enable and disable a user', () => {
    const userPage = editUser()

    userPage.enabled().should('contain.text', ' Active')
    cy.task('stubAuthUserDisable')
    cy.task('stubAuthGetUsername', false)
    userPage.enableLink().should('have.text', 'Deactivate account').click()

    cy.task('verifyUserDisable').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/disable')
    })

    userPage.enabled().should('contain.text', ' Inactive')
    cy.task('stubAuthUserEnable')
    userPage.enableLink().should('have.text', 'Activate account').click()

    cy.task('verifyUserEnable').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/enable')
    })
  })

  it('Should change a user email address', () => {
    const userPage = editUser()

    userPage.changeEmailLink().click()
    const changeEmailPage = AuthUserChangeEmailPage.verifyOnPage()

    changeEmailPage.email().clear().type('a username')
    changeEmailPage.amendButton().click()
    changeEmailPage.errorSummary().should('contain.text', 'Enter an email address in the correct format')

    cy.task('stubAuthUserChangeEmail')
    changeEmailPage.email().clear().type('someone@somewhere.com')
    changeEmailPage.amendButton().click()

    cy.task('verifyAuthUserChangeEmail').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({ email: 'someone@somewhere.com' })
    })

    UserPage.verifyOnPage('Auth Adm')
  })

  it('Should cancel a change user email address', () => {
    const userPage = editUser()

    userPage.changeEmailLink().click()
    const changeEmailPage = AuthUserChangeEmailPage.verifyOnPage()
    changeEmailPage.cancel()
    UserPage.verifyOnPage('Auth Adm')
  })
})
