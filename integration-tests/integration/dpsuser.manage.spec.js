const UserPage = require('../pages/userPage')
const UserChangeEmailPage = require('../pages/userChangeEmailPage')
const ChangeEmailSuccessPage = require('../pages/changeEmailSuccessPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const UserAddCaseloadPage = require('../pages/userAddCaseloadPage')
const AuthErrorPage = require('../pages/authErrorPage')

const { editUser, goToSearchPage } = require('../support/dpsuser.helpers')

context('DPS user manage functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSyncDpsEmail')
  })

  it('Should display details for a user', () => {
    const userPage = editUser({})
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(1).should('contain', 'ITAG_USER@gov.uk')
    userPage.userRows().eq(2).should('contain', 'Yes')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
    userPage.activeCaseloadRow().should('have.length', 1)
    userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
    userPage.caseloadRows().should('have.length', 3)
    userPage.caseloadRows().eq(0).should('contain', 'Leeds')
    userPage.caseloadRows().eq(1).should('contain', 'Moorland')
    userPage.caseloadRows().eq(2).should('contain', 'Pentonville')
  })

  it('Should not display caseload details for a user with no caseloads', () => {
    const userPage = editUser({
      isAdmin: false,
      activeCaseload: false,
      userCaseloads: {
        username: 'ITAG_USER',
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
        caseloads: [],
      },
    })
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(1).should('contain', 'ITAG_USER@gov.uk')
    userPage.userRows().eq(2).should('contain', 'Yes')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
    userPage.activeCaseload().should('be.empty')
    userPage.caseloadRows().should('have.length', 0)
  })

  it('Should leave email blank if no email for user ', () => {
    const results = goToSearchPage({})

    cy.task('stubDpsUserDetailsWithOutEmail')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubManageUserGetRoles', {})
    cy.task('stubEmail', { verified: false })

    results.manageLinkForUser('ITAG_USER5').click()
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(2).should('contain', 'No')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim().replace(/\s\s*/g, ' ')).to.equal('Email Change email')
      })
  })

  it('As an ADMIN user should display details for a user', () => {
    const userPage = editUser({ isAdmin: true })

    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim().replace(/\s\s*/g, ' ')).to.equal('Email ITAG_USER@gov.uk Change email')
      })
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
  })

  it('Should show unverified if email is unverified ', () => {
    const results = goToSearchPage({})

    cy.task('stubDpsUserDetails', {})
    cy.task('stubDpsUserGetRoles')
    cy.task('stubManageUserGetRoles', {})
    cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: false })

    results.manageLinkForUser('ITAG_USER5').click()
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(2).should('contain', 'No')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim().replace(/\s\s*/g, ' ')).to.equal('Email ITAG_USER@gov.uk Change email')
      })
  })

  describe('Change a user email address', () => {
    it('Should change a user email address', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.changeEmailLink().click()
      const changeEmailPage = UserChangeEmailPage.verifyOnPage()

      changeEmailPage.email().clear().type('a username')
      changeEmailPage.amendButton().click()
      changeEmailPage.errorSummary().should('contain.text', 'Enter an email address in the correct format')

      cy.task('stubDpsUserChangeEmail')
      changeEmailPage.email().clear().type('someone@somewhere.com')
      changeEmailPage.amendButton().click()

      cy.task('verifyDpsUserChangeEmail').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(JSON.parse(requests[0].body)).to.deep.equal({ email: 'someone@somewhere.com' })
      })

      const successPage = ChangeEmailSuccessPage.verifyOnPage()
      successPage.email().should('contain.text', 'someone@somewhere.com')
      successPage.userDetailsLink().click()
      UserPage.verifyOnPage('Itag User')
    })

    it('Should cancel a change user email address', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.changeEmailLink().click()
      const changeEmailPage = UserChangeEmailPage.verifyOnPage()
      changeEmailPage.cancel()
      UserPage.verifyOnPage('Itag User')
    })

    it('Should check for CSRF token', () => {
      editUser({ isAdmin: true })

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-dps-users/ITAG_USER5/change-email',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  it('should display banner on select roles page', () => {
    const userPage = editUser({})
    cy.task('stubBannerMessage')
    cy.task('stubManageUserGetRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.message().should('contain.text', 'Notification banner message')
  })

  it('should not display banner on select roles page when message is empty', () => {
    const userPage = editUser({})
    cy.task('stubBannerNoMessage')
    cy.task('stubManageUserGetRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.message().should('not.exist')
  })

  describe('Add and remove a role from a user', () => {
    it('Should add and remove a role from a user', () => {
      const userPage = editUser({})

      userPage.roleRows().should('have.length', 2)
      userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
      userPage.roleRows().eq(1).should('contain', 'Another general role')

      cy.task('stubBannerNoMessage')
      cy.task('stubManageUserGetRoles', {})
      userPage.addRole().click()
      const addRole = UserAddRolePage.verifyOnPage()
      addRole.hint('User Admin').should('contain.text', 'Administering users')

      cy.task('stubDpsAddUserRoles', {})
      addRole.choose('USER_ADMIN')
      addRole.addRoleButton().click()

      cy.task('verifyDpsAddUserRoles').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(JSON.parse(requests[0].body)).to.deep.equal(['USER_ADMIN'])
      })

      UserPage.verifyOnPage('Itag User')

      cy.task('stubDpsRemoveUserRole')
      userPage.removeRole('ANOTHER_GENERAL_ROLE').click()

      cy.task('verifyDpsRemoveUserRole').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/roles/ANOTHER_GENERAL_ROLE')
      })
    })

    it('Should check for CSRF token', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
      cy.signIn()
      editUser({})
      cy.task('stubDpsRemoveUserRole')

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-dps-users/ITAG_USER5/roles/MAINTAIN_ACCESS_ROLES/remove',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })

    it('As an admin user should add and remove a role from a user', () => {
      const results = goToSearchPage({})

      cy.task('stubDpsUserDetails', {})
      cy.task('stubDpsUserGetRoles')
      cy.task('stubBannerNoMessage')
      cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: true })

      results.manageLinkForUser('ITAG_USER5').click()
      const userPage = UserPage.verifyOnPage('Itag User')
      userPage.roleRows().should('have.length', 2)
      userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
      userPage.roleRows().eq(1).should('contain', 'Another general role')

      cy.task('stubManageUserGetAdminRoles', {})
      userPage.addRole().click()
      const addRole = UserAddRolePage.verifyOnPage()
      addRole.hint('User Admin').should('contain.text', 'Administering users')

      cy.task('stubDpsAddUserRoles')
      addRole.choose('USER_ADMIN')
      addRole.addRoleButton().click()

      cy.task('verifyDpsAddUserRoles').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(JSON.parse(requests[0].body)).to.deep.equal(['USER_ADMIN'])
      })

      UserPage.verifyOnPage('Itag User')

      cy.task('stubDpsRemoveUserRole')
      userPage.removeRole('ANOTHER_GENERAL_ROLE').click()

      cy.task('verifyDpsRemoveUserRole').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/roles/ANOTHER_GENERAL_ROLE')
      })
    })

    it('Should check for CSRF token', () => {
      editUser({})

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: 'manage-dps-user/select-roles',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Remove a caseload from a user', () => {
    it('Should remove a caseload from a user', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().should('have.length', 1)
      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(0).should('contain', 'Leeds')

      cy.task('stubDpsRemoveUserCaseload')
      cy.task('verifyDpsRemoveUserCaseload')
      userPage.removeUserCaseload('LEI').click()

      cy.task('verifyDpsRemoveUserCaseload').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/caseloads/LEI')
      })
    })

    it('Active caseload does not have a remove link', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(1).should('contain', 'Moorland')

      cy.task('stubDpsRemoveUserCaseload')
      userPage.removeUserCaseload('MDI').should('not.exist')
      userPage.removeUserCaseload('LEI').should('exist')
    })

    it('Should check for CSRF token', () => {
      editUser({ isAdmin: true })

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-dps-users/ITAG_USER5/caseloads/LEI/remove',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Add caseloads to a user', () => {
    it('Should not show add caseload button if no role', () => {
      const userPage = editUser({})
      cy.task('stubDpsUserDetails', {})

      userPage.caseloadRows().should('have.length', 3)
      userPage.addUserCaseload().should('not.exist')
    })

    it('Should not show remove caseload link if no role', () => {
      const userPage = editUser({})
      cy.task('stubDpsUserDetails', {})

      userPage.caseloadRows().should('have.length', 3)
      userPage.removeUserCaseload('LEI').should('not.exist')
    })

    it('Should add a caseload to a user', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(1).should('contain', 'Moorland')

      cy.task('stubBannerNoMessage')
      cy.task('stubManageUserGetRoles', {})
      cy.task('stubUserCaseloads', {
        username: 'ITAG_USER',
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
        caseloads: [
          {
            id: 'MDI',
            name: 'Moorland',
          },
        ],
      })
      cy.task('stubDpsGetCaseloads')

      userPage.addUserCaseload().click()
      const addUserCaseload = UserAddCaseloadPage.verifyOnPage()

      cy.task('stubDpsAddUserCaseloads')
      addUserCaseload.choose('LEI')
      addUserCaseload.addCaseloadButton().click()

      cy.task('verifyDpsAddUserCaseloads').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(JSON.parse(requests[0].body)).to.deep.equal(['LEI'])
      })
      UserPage.verifyOnPage('Itag User')
    })

    it('Should add all available caseloads to a user', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(1).should('contain', 'Moorland')

      cy.task('stubBannerNoMessage')
      cy.task('stubManageUserGetRoles', {})

      cy.task('stubUserCaseloads', {
        username: 'ITAG_USER',
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
      })
      cy.task('stubDpsGetCaseloads')

      userPage.addUserCaseload().click()
      const addUserCaseload = UserAddCaseloadPage.verifyOnPage()

      cy.task('stubDpsAddUserCaseloads')
      addUserCaseload.choose('ALL')
      addUserCaseload.addCaseloadButton().click()

      cy.task('verifyDpsAddUserCaseloads').should((requests) => {
        expect(requests).to.have.lengthOf(1)
        expect(JSON.parse(requests[0].body)).to.deep.equal(['MDI', 'LEI'])
      })
      UserPage.verifyOnPage('Itag User')
    })

    it('Should show no caseloads available if none assignable', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(1).should('contain', 'Moorland')

      cy.task('stubBannerNoMessage')
      cy.task('stubManageUserGetRoles', {})
      cy.task('stubUserCaseloads')
      cy.task('stubDpsGetCaseloads')

      userPage.addUserCaseload().click()
      const addUserCaseload = UserAddCaseloadPage.verifyOnPage()

      addUserCaseload.noCaseloads().should('contain', 'There are no caseloads available for you to assign.')
      addUserCaseload.cancel()

      UserPage.verifyOnPage('Itag User')
    })

    it('Should provide breadcrumb link back to user', () => {
      const userPage = editUser({ isAdmin: true })

      userPage.activeCaseloadRow().eq(0).should('contain', 'Moorland')
      userPage.caseloadRows().should('have.length', 3)
      userPage.caseloadRows().eq(1).should('contain', 'Moorland')

      cy.task('stubDpsGetCaseloads')
      cy.task('stubUserCaseloads', {})

      userPage.addUserCaseload().click()
      const addUserCaseload = UserAddCaseloadPage.verifyOnPage()
      addUserCaseload.userBreadcrumb('ITAG_USER5').should('have.attr', 'href', '/manage-dps-users/ITAG_USER5/details')
    })

    it('Should check for CSRF token', () => {
      editUser({ isAdmin: true })

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-dps-users/ITAG_USER5/select-caseloads',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })

    it('Should fail attempting to reach "select-caseloads" if unauthorised', () => {
      const userPage = editUser({ isAdmin: false })
      cy.task('stubDpsUserDetails', {})
      userPage.addUserCaseload().should('not.exist')

      cy.visit('/manage-dps-users/ITAG_USER5/select-caseloads', { failOnStatusCode: false })
      AuthErrorPage.verifyOnPage()
    })
  })

  it('Should provide breadcrumb link back to search results', () => {
    const userPage = editUser({})

    userPage
      .searchBreadcrumb()
      .should('have.attr', 'href', '/search-with-filter-dps-users?user=ITAG_USER5&status=ALL&inclusiveRoles=false')
  })

  it('Manage your details contain returnTo url for current dps search page', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.task('stubBannerNoMessage')
    cy.signIn()
    cy.task('stubManageUserGetRoles', {})
    const search = goToSearchPage({})
    search
      .manageYourDetails()
      .should('contain', 'Manage your details')
      .and('have.attr', 'href')
      .and('contains', '%2Fsearch-with-filter-dps-users')
  })

  describe('Activate and deactivate a user', () => {
    it('Should disable a user', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
      })
      userPage.enabled().should('contain.text', ' Active')
      cy.task('stubDpsUserDisable')
      cy.task('stubDpsUserDetails', { active: false })
      userPage.enableLink().should('not.exist')
      userPage.activateLink().should('not.exist')
      userPage.deactivateLink().should('be.visible').click()

      cy.task('verifyDpsUserDisable').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/lock-user')
      })
      userPage.enabled().should('contain.text', ' Inactive')
    })

    it('Should disable an expired user', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        accountStatus: 'EXPIRED',
        active: false,
      })
      userPage.enabled().should('contain.text', '  EXPIRED ACCOUNT')
      cy.task('stubDpsUserDisable')
      cy.task('stubDpsUserDetails', { active: false })
      userPage.enableLink().should('not.exist')
      userPage.activateLink().should('not.exist')
      userPage.deactivateLink().should('be.visible').click()

      cy.task('verifyDpsUserDisable').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/lock-user')
      })
      userPage.enabled().should('contain.text', ' Inactive')
    })

    it('Should enable an inactive user', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        active: false,
        enabled: false,
      })
      userPage.enabled().should('contain.text', ' Inactive')
      cy.task('stubDpsUserEnable')
      cy.task('stubDpsUserDetails', {})
      userPage.activateLink().should('not.exist')
      userPage.deactivateLink().should('not.exist')
      userPage.enableLink().should('be.visible').click()

      cy.task('verifyDpsUserEnable').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/unlock-user')
      })
      userPage.enabled().should('contain.text', ' Active')
    })

    it('Should not allow deactivate(lock) DPS user if user already disabled', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        active: true,
        enabled: false,
      })
      userPage.enabled().should('contain.text', ' Active')
      userPage.enableLink().should('not.exist')
    })

    it('Should not allow activate(unlock) DPS user if user already enabled', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        active: false,
        enabled: true,
      })
      userPage.enabled().should('contain.text', ' Inactive')
      userPage.enableLink().should('not.exist')
    })

    it('Should not allow activate(unlock) DPS user if no role', () => {
      const userPage = editUser({ isAdmin: false, enabled: false, active: false })

      userPage.enabled().should('contain.text', ' Inactive')
      userPage.enableLink().should('not.exist')
    })

    it('Should not allow deactivate(lock) DPS user if no role', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }],
      })
      cy.task('stubDpsUserDetails', {})

      userPage.enabled().should('contain.text', ' Active')
      userPage.enableLink().should('not.exist')
    })
    it('Should not allow deactivate(lock) for expired DPS user if no role', () => {
      const userPage = editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }],
        accountStatus: 'EXPIRED',
        active: false,
      })
      cy.task('stubDpsUserDetails', {})

      userPage.enabled().should('contain.text', '  EXPIRED ACCOUNT')
      userPage.enableLink().should('not.exist')
    })

    it('Should check for CSRF token on activate(unlock) user', () => {
      editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        active: false,
        enabled: false,
      })
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

    it('Should check for CSRF token on deactivate(lock) user', () => {
      editUser({
        roleCodes: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }],
        active: true,
        enabled: true,
      })
      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/deactivate',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })
})
