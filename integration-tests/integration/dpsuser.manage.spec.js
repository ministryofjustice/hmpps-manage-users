const UserPage = require('../pages/userPage')
const UserChangeEmailPage = require('../pages/userChangeEmailPage')
const ChangeEmailSuccessPage = require('../pages/changeEmailSuccessPage')
const UserAddRolePage = require('../pages/userAddRolePage')
const DpsUserSearchPage = require('../pages/dpsUserSearchPage')

const { goToResultsPage, editUser } = require('../support/dpsuser.helpers')

context('DPS user manage functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display details for a user ', () => {
    const userPage = editUser({})
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(1).should('contain', 'ITAG_USER@gov.uk')
    userPage.userRows().eq(2).should('contain', 'Yes')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
  })

  it('Should leave email blank if no email for user ', () => {
    const results = goToResultsPage({})

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubManageUserGetRoles', {})
    cy.task('stubEmail', { verified: false })

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(2).should('contain', 'No')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim().replace(/\s\s*/g, ' ')).to.equal('Email')
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
    const results = goToResultsPage({})

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubManageUserGetRoles', {})
    cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: false })

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(2).should('contain', 'No')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim().replace(/\s\s*/g, ' ')).to.equal('Email ITAG_USER@gov.uk')
      })
  })

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
    cy.task('stubDpsAdminSearch', { totalElements: 21 })
    const userPage = editUser({ isAdmin: true })

    userPage.changeEmailLink().click()
    const changeEmailPage = UserChangeEmailPage.verifyOnPage()
    changeEmailPage.cancel()
    UserPage.verifyOnPage('Itag User')
  })

  it('should display banner on select roles page', () => {
    const userPage = editUser({})
    cy.task('stubRoleBannerMessage')
    cy.task('stubManageUserGetRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.message().should('contain.text', 'Notification banner message')
  })

  it('should not display banner on select roles page when message is empty', () => {
    const userPage = editUser({})
    cy.task('stubRoleBannerNoMessage')
    cy.task('stubManageUserGetRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.message().should('not.exist')
  })

  it('Should add and remove a role from a user', () => {
    const userPage = editUser({})

    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')

    cy.task('stubRoleBannerNoMessage')
    cy.task('stubManageUserGetRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.hint('User Admin').should('contain.text', 'Administering users')

    cy.task('stubDpsAddRoles', {})
    addRole.choose('USER_ADMIN')
    addRole.addRoleButton().click()

    cy.task('verifyDpsAddRoles').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal(['USER_ADMIN'])
    })

    UserPage.verifyOnPage('Itag User')

    cy.task('stubDpsRemoveRole')
    userPage.removeRole('ANOTHER_GENERAL_ROLE').click()

    cy.task('verifyDpsRemoveRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/roles/ANOTHER_GENERAL_ROLE')
    })
  })

  it('As an admin user should add and remove a role from a user', () => {
    const results = goToResultsPage({ isAdmin: true })

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubRoleBannerNoMessage')
    cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: true })

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')

    cy.task('stubManageUserGetAdminRoles', {})
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.hint('User Admin').should('contain.text', 'Administering users')

    cy.task('stubDpsAddRoles')
    addRole.choose('USER_ADMIN')
    addRole.addRoleButton().click()

    cy.task('verifyDpsAddRoles').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal(['USER_ADMIN'])
    })

    UserPage.verifyOnPage('Itag User')

    cy.task('stubDpsRemoveRole')
    userPage.removeRole('ANOTHER_GENERAL_ROLE').click()

    cy.task('verifyDpsRemoveRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/nomisusersandroles/users/ITAG_USER5/roles/ANOTHER_GENERAL_ROLE')
    })
  })

  it('Should provide breadcrumb link back to search results and start search', () => {
    const userPage = editUser({ nextPage: true })

    userPage.searchBreadcrumb().should('have.attr', 'href', '/search-dps-users')
    userPage
      .searchResultsBreadcrumb()
      .should(
        'have.attr',
        'href',
        '/search-dps-users/results?user=sometext%40somewhere.com&status=ALL&roleCode=&offset=10',
      )
  })

  it('Should provide breadcrumb link back to search results with filter only', () => {
    const userPage = editUser({ nextPage: true, fromSearchFilterPage: true })

    userPage.searchBreadcrumb().should('have.attr', 'href', '/search-with-filter-dps-users?user=ITAG_USER5&status=ALL')
    userPage.searchResultsBreadcrumb().should('not.exist')
  })

  it('Manage your details contain returnTo url for current dps search page', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    cy.task('stubManageUserGetRoles', {})
    const search = DpsUserSearchPage.goTo()
    search
      .manageYourDetails()
      .should('contain', 'Manage your details')
      .and('have.attr', 'href')
      .and('contains', '%2Fsearch-dps-users')
  })
})
