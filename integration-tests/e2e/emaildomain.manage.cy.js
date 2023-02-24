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
    emailDomains.rows().eq(0).should('include.text', 'DOMAIN1')
    emailDomains.rows().eq(0).should('include.text', 'DOMAIN 1 DESCRIPTION')
    emailDomains.rows().eq(0).should('include.html', '/delete-email-domain')
    emailDomains.rows().eq(0).should('include.text', 'Delete')
    emailDomains.rows().eq(1).should('include.text', 'DOMAIN2')
    emailDomains.rows().eq(1).should('include.text', 'DOMAIN 2 DESCRIPTION')
    emailDomains.rows().eq(1).should('include.html', '/delete-email-domain')
    emailDomains.rows().eq(1).should('include.text', 'Delete')
  })
})
