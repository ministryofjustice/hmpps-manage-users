const MenuPage = require('../pages/menuPage')
const EmailDomainListingPage = require('../pages/emailDomainListingPage')
const EmailDomainDeletionPage = require('../pages/emailDomainDeletionPage')
const AuthErrorPage = require('../pages/authErrorPage')

context('DeleteEmailDomain', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  function navigateToDeleteEmailDomainPage() {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.emailDomainDeleteLink().click()
    return EmailDomainDeletionPage.verifyOnPage()
  }

  it('Should disallow attempting to reach delete-email-domain page directly via URL, if unauthorised', () => {
    cy.task('stubSignIn', {
      roles: [{ roleCode: 'NOT_MAINTAIN_EMAIL_DOMAINS' }],
    })
    cy.signIn()
    MenuPage.verifyOnPage()
    cy.get('[data-qa="view_email_domains_link"]').should('not.exist')
    cy.visit('/delete-email-domain', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })

  it('Should delete email domain, on navigating to the delete email domain page and clicking the delete email domain button', () => {
    const emailDomainDeletePage = navigateToDeleteEmailDomainPage()
    emailDomainDeletePage.delete({ domainId: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127' })
    cy.task('verifyDeleteEmailDomain').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(requests[0].url).contains('cb5d9f0c-b7c8-40d5-8626-2e97f66d5127')
    })
  })

  it('Should check for CSRF token, ', () => {
    navigateToDeleteEmailDomainPage()
    cy.request({
      method: 'POST',
      url: '/delete-email-domain',
      body: { domainId: '1234' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })

  it('Should navigate to email domain listing page, on-clicking the cancel button on the delete email domain page', () => {
    const emailDomainDeletePage = navigateToDeleteEmailDomainPage()
    emailDomainDeletePage.cancel()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.emailDomainListingTableRows().should('have.length', 3)
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN1')
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN 1 DESCRIPTION')
  })
})
