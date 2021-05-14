const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const UserAddGroupPage = require('../pages/userAddGroupPage')
const AuthUserChangeEmailPage = require('../pages/userChangeEmailPage')
const ChangeEmailSuccessPage = require('../pages/changeEmailSuccessPage')
const ChangeUsernameSuccessPage = require('../pages/changeUsernameSuccessPage')
const deactivateUserReasonPage = require('../pages/deactivateUserReasonPage')
const { searchForUser, replicateUser } = require('../support/externaluser.helpers')

const editUser = (roleCode, assignableGroups = []) => {
  const results = searchForUser(roleCode, undefined, assignableGroups)

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

  it('Remove a group from a user not available for group managers if not a member of group', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER')

    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    userPage.removeGroup('SITE_1_GROUP_1').should('not.exist')
  })

  it('Remove a group from a user available for group managers when member of group', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER', [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }])
    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    cy.task('stubAuthRemoveGroup')
    userPage.removeGroup('SITE_1_GROUP_1').click()
    userPage.removeGroup('SITE_1_GROUP_2').should('not.exist')
  })

  it('Remove last group, group manager receive error when trying to remove users last group', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER', [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }])
    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    cy.task('stubAuthGroupManagerRemoveLastGroup')
    userPage.removeGroup('SITE_1_GROUP_1').click()
    userPage
      .errorSummary()
      .should(
        'contain.text',
        'You are not allowed to remove the last group from this user, please deactivate their account instead',
      )
  })

  it('Add a group to a user available for group managers', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER')

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
  })

  it('Add a group to a user not in group managers groups displays error', () => {
    const userPage = editUser('AUTH_GROUP_MANAGER')

    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

    cy.task('stubAuthAssignableGroups', {})
    userPage.addGroup().click()
    const addGroup = UserAddGroupPage.verifyOnPage()

    cy.task('stubAuthAddGroupGroupManagerCannotMaintainUser')
    addGroup.type('SOCU North West')
    addGroup.addGroupButton().click()
    addGroup
      .errorSummary()
      .should(
        'contain.text',
        'You are not able to maintain this user anymore, user does not belong to any groups you manage',
      )
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
        '/search-external-users/results?user=sometext%40somewhere.com&status=ALL&groupCode=&roleCode=&page=1',
      )
  })

  it('Should enable and disable a user', () => {
    const userPage = editUser()

    userPage.enabled().should('contain.text', ' Active')
    cy.task('stubAuthUserDisable')
    cy.task('stubAuthGetUsername', false)
    userPage.enableLink().should('have.text', 'Deactivate account').click()

    const deactivatePage = deactivateUserReasonPage.verifyOnPage()
    deactivatePage.deactivateUser('Left')

    cy.task('verifyUserDisable').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/disable')
    })

    userPage.enabled().should('contain.text', ' Inactive')
    userPage.inactiveReason().should('contain.text', ' left')
    cy.task('stubAuthUserEnable')
    userPage.enableLink().should('have.text', 'Activate account').click()

    cy.task('verifyUserEnable').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/enable')
    })
  })

  it('Should throw error when reason fails validation when disable a user', () => {
    const userPage = editUser()

    userPage.enabled().should('contain.text', ' Active')
    cy.task('stubAuthUserDisable')
    cy.task('stubAuthGetUsername', false)
    userPage.enableLink().should('have.text', 'Deactivate account').click()

    const deactivatePage = deactivateUserReasonPage.verifyOnPage()
    deactivatePage.deactivateUser()
    deactivatePage.errorSummary().should('contain.text', 'Enter the reason')
    deactivatePage.deactivateUser('a')
    deactivatePage.errorSummary().should('contain.text', 'Enter the reason')
    deactivatePage.deactivateUser('Left')

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

    const successPage = ChangeEmailSuccessPage.verifyOnPage()
    successPage.email().should('contain.text', 'someone@somewhere.com')
    successPage.userDetailsLink().click()
    UserPage.verifyOnPage('Auth Adm')
  })

  it('Should change a user email address when username same as email address', () => {
    const results = searchForUser(undefined, [
      {
        username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
        email: 'auth_test2@digital.justice.gov.uk',
        enabled: true,
        locked: false,
        verified: false,
        firstName: 'Auth',
        lastName: 'Adm',
      },
    ])

    cy.task('stubAuthGetUserWithEmail')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    results.edit('AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK')
    const userPage = UserPage.verifyOnPage('Auth Adm')
    userPage.changeEmailLink().click()
    const changeEmailPage = AuthUserChangeEmailPage.verifyOnPage()

    cy.task('stubAuthUserChangeEmail')
    changeEmailPage.email().clear().type('someone@somewhere.com')
    changeEmailPage.amendButton().click()

    cy.task('verifyAuthUserChangeEmail').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({ email: 'someone@somewhere.com' })
    })

    const successPage = ChangeUsernameSuccessPage.verifyOnPage()
    successPage.email().should('contain.text', 'someone@somewhere.com')
    successPage.userDetailsLink().click()
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
