const MenuPage = require('../pages/menuPage')
const EmailDomainListingPage = require('../pages/emailDomainListingPage')

context('EmailDomains', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display results for all email domains', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()

    const emailDomains = EmailDomainListingPage.verifyOnPage()

    emailDomains.rows().should('have.length', 3)
  })
})
