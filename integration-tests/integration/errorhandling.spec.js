const ErrorPage = require('../pages/errorPage')
const NotFoundPage = require('../pages/notFoundPage')

context('Sign in functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('404 Errors are handled by the global exception handler', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()
    cy.task('stubAuthUserFail', 'USER_NOT_FOUND')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')

    cy.visit('/manage-external-users/USER_NOT_FOUND/details', { failOnStatusCode: false })
    NotFoundPage.verifyOnPage()
  })

  it('Errors are handled by the global exception handler', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()
    cy.task('stubError')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')

    cy.visit('/manage-external-users/2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f/details', {
      failOnStatusCode: false,
    })
    ErrorPage.verifyOnPage()
  })
})
