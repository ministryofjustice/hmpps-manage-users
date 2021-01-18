const ErrorPage = require('../pages/errorPage')

context('Login functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Errors are handled by the global exception handler', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.visit('/manage-external-users/USER_NOT_FOUND/details', { failOnStatusCode: false })

    ErrorPage.verifyOnPage()
  })
})
