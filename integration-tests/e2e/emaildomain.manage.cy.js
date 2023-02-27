const MenuPage = require('../pages/menuPage')
const EmailDomainListingPage = require('../pages/emailDomainListingPage')

context('EmailDomains', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display email domain listing with the create and delete email domain button and link respectively', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()

    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.emailDomainListingTableRows().should('have.length', 3)
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN1')
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN 1 DESCRIPTION')
    emailDomainListingPage
      .emailDomainListingTableRows()
      .eq(0)
      .find('td')
      .eq(2)
      .should('include.html', '/delete-email-domain?id=cb5d9f0c-b7c8-40d5-8626-2e97f66d5127&amp;name=DOMAIN1')
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'Delete')
    emailDomainListingPage.emailDomainListingTableRows().eq(1).should('include.text', 'DOMAIN2')
    emailDomainListingPage.emailDomainListingTableRows().eq(1).should('include.text', 'DOMAIN 2 DESCRIPTION')
    emailDomainListingPage
      .emailDomainListingTableRows()
      .eq(1)
      .find('td')
      .eq(2)
      .should('include.html', '/delete-email-domain?id=acf5e424-2f7c-4bea-ac1e-07d2553f3e63&amp;name=DOMAIN2')
    emailDomainListingPage.emailDomainListingTableRows().eq(1).should('include.text', 'Delete')

    emailDomainListingPage.createEmailDomainButton().should('include.html', 'Add Email Domain')
  })
})
