const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const UserChangeEmailPage = require('../pages/userChangeEmailPage')
const ChangeEmailSuccessPage = require('../pages/changeEmailSuccessPage')

const { goToResultsPage, editUser } = require('../support/dpsuser.helpers')

context('DPS user manage functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display details for a user ', () => {
    const userPage = editUser()
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(1).should('contain', 'ITAG_USER@gov.uk')
    userPage.userRows().eq(2).should('contain', 'Yes')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
  })

  it('Should leave email blank if no email for user ', () => {
    const results = goToResultsPage()

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
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
    cy.task('stubDpsAdminSearch', { totalElements: 21 })
    const userPage = editUser([{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])

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
    const results = goToResultsPage()

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
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
    cy.task('stubDpsAdminSearch', { totalElements: 21 })
    const userPage = editUser([{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])

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
    const userPage = editUser([{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])

    userPage.changeEmailLink().click()
    const changeEmailPage = UserChangeEmailPage.verifyOnPage()
    changeEmailPage.cancel()
    UserPage.verifyOnPage('Itag User')
  })
})
