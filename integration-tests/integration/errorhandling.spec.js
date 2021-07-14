const ErrorPage = require('../pages/errorPage')
const NotFoundPage = require('../pages/notFoundPage')

context('Login functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('404 Errors are handled by the global exception handler', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.visit('/manage-external-users/USER_NOT_FOUND/id/details', { failOnStatusCode: false })
    NotFoundPage.verifyOnPage()
  })

  it('Errors are handled by the global exception handler', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubError')

    cy.visit('/manage-external-users/USER_NOT_FOUND/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/details', {
      failOnStatusCode: false,
    })
    ErrorPage.verifyOnPage()
  })
})
