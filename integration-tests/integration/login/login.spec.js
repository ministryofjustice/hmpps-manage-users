const MenuPage = require('../../pages/menuPage')
const UnauthorisedPage = require('../../pages/unauthorisedPage')

context('Login functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Root (/) redirects to the auth login page if not logged in', () => {
    cy.task('stubLoginPage')
    cy.visit('/')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Login page redirects to the auth login page if not logged in', () => {
    cy.task('stubLoginPage')
    cy.visit('/login')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Page redirects to the auth login page if not logged in', () => {
    cy.task('stubLogin', {})
    cy.visit('/login')
    cy.url().should('include', 'authorize')
    cy.get('h1').should('contain.text', 'Sign in')
  })

  it('Logout takes user to login page', () => {
    cy.task('stubLogin', {})
    cy.login()
    MenuPage.verifyOnPage()

    // can't do a visit here as cypress requires only one domain
    cy.request('/auth/logout').its('body').should('contain', 'Sign in')
  })

  it('Token verification failure clears user session', () => {
    cy.task('stubLogin', {})
    cy.login()
    MenuPage.verifyOnPage()
    cy.task('stubVerifyToken', false)

    // can't do a visit here as cypress requires only one domain
    cy.request('/').its('body').should('contain', 'Sign in')
  })

  it('Log in as ordinary user receives unauthorised', () => {
    cy.task('stubLogin', { username: 'joe', roles: [{}] })
    cy.login()
    UnauthorisedPage.verifyOnPage()
  })

  it('Log in as access roles user', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    MenuPage.verifyOnPage()
  })
})
