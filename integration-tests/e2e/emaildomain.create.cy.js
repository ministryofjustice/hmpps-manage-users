const MenuPage = require('../pages/menuPage')
const EmailDomainListingPage = require('../pages/emailDomainListingPage')
const EmailDomainCreationPage = require('../pages/emailDomainCreationPage')
const AuthErrorPage = require('../pages/authErrorPage')

context('CreateEmailDomain', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  function navigateToCreateEmailDomainPage() {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()
    return EmailDomainCreationPage.verifyOnPage()
  }

  it('Should disallow attempting to reach create-email-domain page directly via URL, if unauthorised', () => {
    cy.task('stubSignIn', {
      roles: [{ roleCode: 'NOT_MAINTAIN_EMAIL_DOMAINS' }],
    })
    cy.signIn()
    MenuPage.verifyOnPage()
    cy.get('[data-qa="view_email_domains_link"]').should('not.exist')
    cy.visit('/create-email-domain', { failOnStatusCode: false })
    AuthErrorPage.verifyOnPage()
  })

  it('Should create new email domain, after completing form and clicking the create email domain button', () => {
    const emailDomainCreationPage = navigateToCreateEmailDomainPage()
    emailDomainCreationPage.createEmailDomainPage('Domain1', 'Domain1Description')
    cy.task('verifyCreateEmailDomain').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.include({
        name: 'Domain1',
        description: 'Domain1Description',
      })
    })
  })

  it('Should check for CSRF token', () => {
    navigateToCreateEmailDomainPage()
    cy.request({
      method: 'POST',
      url: '/create-email-domain',
      body: { name: 'DomainName1', description: 'DomainDescription1' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })

  it('Should display error and prevent form submission, when email domain description is blank', () => {
    const emailDomainCreationPage = navigateToCreateEmailDomainPage()
    emailDomainCreationPage.createEmailDomainPage('Domain1', '')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain description')
  })

  it('Should display error and prevent form submission, when email domain name is blank', () => {
    const emailDomainCreationPage = navigateToCreateEmailDomainPage()
    emailDomainCreationPage.createEmailDomainPage('', 'Domain1Description')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain name')
  })

  it('Should display error and prevent form submission, when both email domain name and description are blank', () => {
    const emailDomainCreationPage = navigateToCreateEmailDomainPage()
    emailDomainCreationPage.createEmailDomainPage('', '')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain description')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain name')
  })

  it('Should navigate to email domain listing, on-clicking the cancel create email domain button', () => {
    const emailDomainCreationPage = navigateToCreateEmailDomainPage()
    emailDomainCreationPage.cancel()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.emailDomainListingTableRows().should('have.length', 3)
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN1')
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN 1 DESCRIPTION')
  })
})
