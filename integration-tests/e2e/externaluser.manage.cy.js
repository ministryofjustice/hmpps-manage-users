const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserPage = require('../pages/userPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const UserAddGroupPage = require('../pages/userAddGroupPage')
const AuthUserChangeEmailPage = require('../pages/userChangeEmailPage')
const ChangeEmailSuccessPage = require('../pages/changeEmailSuccessPage')
const ChangeUsernameSuccessPage = require('../pages/changeUsernameSuccessPage')
const deactivateUserReasonPage = require('../pages/deactivateUserReasonPage')
const { searchForUser } = require('../support/externaluser.helpers')

const editUser = (roleCode, assignableGroups = []) => {
  const results = searchForUser(roleCode, undefined, assignableGroups)

  cy.task('stubAuthGetUsername')
  cy.task('stubExternalUserRoles')
  cy.task('stubManageUserGroups')
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

  it('Should display details for a user', () => {
    const userPage = editUser()

    userPage.userRows().eq(0).should('contain', 'AUTH_ADM')
    userPage.userRows().eq(1).should('contain', 'auth_test2@digital.justice.gov.uk')
    userPage.userRows().eq(0).should('contain', 'Username')
    userPage.userRows().eq(1).should('contain', 'Email')
    userPage.userRows().eq(0).should('not.contain', 'Username / email')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Global Search')
    userPage.roleRows().eq(1).should('contain', 'Licence Responsible Officer')
    userPage.groupRows().should('have.length', 2)
    userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')
    userPage.groupRows().eq(1).should('contain', 'Site 1 - Group 2')
    userPage.activeCaseloadRow().should('not.exist')
    userPage.caseloadRows().should('not.exist')
  })

  it('Should be able to return to search page', () => {
    const userPage = editUser()

    userPage.searchLink().click()
    AuthUserSearchPage.verifyOnPage()
  })

  it('Should view a user with username as email address', () => {
    const results = searchForUser()

    cy.task('stubAuthGetUserWithEmail')
    cy.task('stubExternalUserRoles')
    cy.task('stubManageUserGroups')
    results.edit('AUTH_ADM')

    const userPage = UserPage.verifyOnPage('Auth Adm')
    userPage.userRows().eq(0).should('contain', 'auth_test2@digital.justice.gov.uk')
    userPage.userRows().eq(0).should('contain', 'Username / email')
  })

  describe('Add and remove a role from a user', () => {
    it('Should add and remove a role from a user', () => {
      const userPage = editUser()

      userPage.roleRows().should('have.length', 2)
      userPage.roleRows().eq(0).should('contain', 'Global Search')

      cy.task('stubUserAssignableRoles')
      userPage.addRole().click()
      const addRole = UserAddRolePage.verifyOnPage()
      addRole.hint('Global Search').should('contain.text', 'Is allowed to search')

      cy.task('stubExternalUserAddRoles')
      addRole.choose('LICENCE_VARY')
      addRole.choose('LICENCE_RO')
      addRole.addRoleButton().click()

      cy.task('verifyAddRoles').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(JSON.parse(requests[0].body)).to.deep.equal(['LICENCE_RO', 'LICENCE_VARY'])
      })

      UserPage.verifyOnPage('Auth Adm')

      cy.task('stubManageUsersRemoveRole')
      userPage.removeRole('GLOBAL_SEARCH').click()

      cy.task('verifyRemoveRole').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/roles/GLOBAL_SEARCH')
      })
    })

    it('Should cancel an add role', () => {
      const userPage = editUser()

      cy.task('stubUserAssignableRoles')
      userPage.addRole().click()
      const addRole = UserAddRolePage.verifyOnPage()

      addRole.cancel()
      UserPage.verifyOnPage('Auth Adm')
    })

    it('Should check for CSRF token', () => {
      editUser()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/select-roles',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Add and remove a group from a user', () => {
    it('Should add and remove a group from a user', () => {
      const userPage = editUser()

      userPage.groupRows().should('have.length', 2)
      userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

      cy.task('stubAssignableGroups', {})
      userPage.addGroup().click()
      const addGroup = UserAddGroupPage.verifyOnPage()

      cy.task('stubManageUsersAddGroup')
      addGroup.type('SOCU North West')
      addGroup.addGroupButton().click()

      cy.task('verifyAddGroup').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/groups/SOC_NORTH_WEST')
      })

      UserPage.verifyOnPage('Auth Adm')

      cy.task('stubManageUsersRemoveGroup')
      userPage.removeGroup('SITE_1_GROUP_1').click()

      cy.task('verifyRemoveGroup').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/groups/SITE_1_GROUP_1')
      })
    })

    it('Should check for CSRF token on remove group', () => {
      editUser()
      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/groups/SITE_1_GROUP_1/remove',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })

    it('Should cancel an add group', () => {
      const userPage = editUser()

      cy.task('stubAssignableGroups', {})
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

      cy.task('stubManageUsersRemoveGroup')
      userPage.removeGroup('SITE_1_GROUP_1').click()
      userPage.removeGroup('SITE_1_GROUP_2').should('not.exist')
    })

    it('Remove last group, group manager receive error when trying to remove users last group', () => {
      const userPage = editUser('AUTH_GROUP_MANAGER', [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }])
      userPage.groupRows().should('have.length', 2)
      userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

      cy.task('stubManageUsersGroupManagerRemoveLastGroup')
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

      cy.task('stubAssignableGroups', {})
      userPage.addGroup().click()
      const addGroup = UserAddGroupPage.verifyOnPage()

      cy.task('stubManageUsersAddGroup')
      addGroup.type('SOCU North West')
      addGroup.addGroupButton().click()

      cy.task('verifyAddGroup').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/groups/SOC_NORTH_WEST')
      })
    })

    it('Add a group to a user not in group managers groups displays error', () => {
      const userPage = editUser('AUTH_GROUP_MANAGER')

      userPage.groupRows().should('have.length', 2)
      userPage.groupRows().eq(0).should('contain', 'Site 1 - Group 1')

      cy.task('stubAssignableGroups', {})
      userPage.addGroup().click()
      const addGroup = UserAddGroupPage.verifyOnPage()

      cy.task('stubManageUsersAddGroupGroupManagerCannotMaintainUser')
      addGroup.type('SOCU North West')
      addGroup.addGroupButton().click()
      addGroup
        .errorSummary()
        .should(
          'contain.text',
          'You are not able to maintain this user anymore, user does not belong to any groups you manage',
        )
    })

    it('Should check for CSRF token', () => {
      editUser()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/select-group',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  it('Should display message if no roles to add', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAuthGetUsername')
    cy.task('stubUserAssignableRoles', [])
    cy.visit('/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/select-roles')
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.noRoles().should('contain', 'There are no roles available for you to assign.')
  })

  describe('Enable and disable a user', () => {
    it('Should enable and disable a user', () => {
      const userPage = editUser()

      userPage.enabled().should('contain.text', ' Active')
      cy.task('stubExternalUserDisable')
      cy.task('stubAuthGetUsername', false)
      userPage.enableLink().should('have.text', 'Deactivate account').click()

      const deactivatePage = deactivateUserReasonPage.verifyOnPage()
      deactivatePage.deactivateUser('Left')

      cy.task('verifyExternalUserDisable').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/disable')
      })

      userPage.enabled().should('contain.text', ' Inactive')
      userPage.inactiveReason().eq(0).should('contain', 'Left')
      cy.task('stubExternalUserEnable')
      userPage.enableLink().should('not.exist')
      userPage.deactivateLink().should('not.exist')
      userPage.activateLink().should('be.visible').click()

      cy.task('verifyExternalUserEnable').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/enable')
      })
    })

    it('Should throw error when reason fails validation when disable a user', () => {
      const userPage = editUser()

      userPage.enabled().should('contain.text', ' Active')
      cy.task('stubExternalUserDisable')
      cy.task('stubAuthGetUsername', false)
      userPage.enableLink().should('have.text', 'Deactivate account').click()

      const deactivatePage = deactivateUserReasonPage.verifyOnPage()
      deactivatePage.deactivateUser()
      deactivatePage.errorSummary().should('contain.text', 'Enter the reason')
      deactivatePage.deactivateUser('a')
      deactivatePage.errorSummary().should('contain.text', 'Enter the reason')
      deactivatePage.deactivateUser('Left')

      cy.task('verifyExternalUserDisable').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/disable')
      })

      userPage.enabled().should('contain.text', ' Inactive')
      cy.task('stubExternalUserEnable')
      userPage.enableLink().should('not.exist')
      userPage.deactivateLink().should('not.exist')
      userPage.activateLink().should('be.visible').click()

      cy.task('verifyExternalUserEnable').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(requests[0].url).to.equal('/externalusers/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/enable')
      })
    })

    it('Should check for CSRF token activate user', () => {
      editUser()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/activate',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })

    it('Should check for CSRF token- deactivate reason', () => {
      editUser()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/deactivate/reason',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
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
        userId: 1,
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
    cy.task('stubExternalUserRoles')
    cy.task('stubManageUserGroups')
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
