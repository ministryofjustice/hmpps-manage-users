const MenuPage = require('../pages/menuPage')

context('Sign in functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Root (/) redirects to the auth sign in page if not signed in', () => {
    cy.task('stubSignInPage')
    cy.visit('/')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Sign in page redirects to the auth sign in page if not signed in', () => {
    cy.task('stubSignInPage')
    cy.visit('/sign-in')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Page redirects to the auth sign in page if not signed in', () => {
    cy.task('stubSignIn', {})
    cy.visit('/sign-in')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Sign out takes user to sign in page', () => {
    cy.task('stubSignIn', {})
    cy.signIn()
    MenuPage.verifyOnPage()

    // can't do a visit here as cypress requires only one domain
    cy.request('/auth/sign-out').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.task('stubSignIn', {})
    cy.signIn()
    MenuPage.verifyOnPage()
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.task('stubSignIn', {})
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')

    cy.task('stubVerifyToken', true)
    cy.task('stubUserMe', { name: 'Bobby Brown' })
    cy.signIn()

    menuPage.headerUsername().contains('B. Brown')
  })

  it('Sign in as ordinary user receives unauthorised', () => {
    cy.task('stubSignIn', { username: 'joe', roles: [{}] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.noAdminFunctionsMessage().contains('There are no admin functions associated with your account.')
  })

  it('Sign in as access roles user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    MenuPage.verifyOnPage()
  })

  it('Sign in and check header of user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.headerUsername().contains('J. Stuart')
    menuPage.headerCaseload().contains('Moorland')
  })
})
