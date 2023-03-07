const MenuPage = require('../pages/menuPage')
const EmailDomainListingPage = require('../pages/emailDomainListingPage')
const EmailDomainCreationPage = require('../pages/emailDomainCreationPage')

context('CreateEmailDomain', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should create new email domain, after completing form and clicking the  create email domain button', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()
    const emailDomainCreationPage = EmailDomainCreationPage.verifyOnPage()
    cy.task('stubCreateEmailDomain', {})
    emailDomainCreationPage.createEmailDomainPage('Domain1', 'Domain1Description')
    cy.task('verifyGetAllEmailDomains').should((requests) => {
      expect(requests).to.have.lengthOf(1)
    })
  })

  it('Should display error and prevent form submission, when email domain description is blank', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()
    const emailDomainCreationPage = EmailDomainCreationPage.verifyOnPage()
    emailDomainCreationPage.createEmailDomainPage('Domain1', '')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain description')
  })

  it('Should display error and prevent form submission, when email domain name is blank', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()
    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()
    const emailDomainCreationPage = EmailDomainCreationPage.verifyOnPage()
    emailDomainCreationPage.createEmailDomainPage('', 'Domain1Description')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain name')
  })

  it('Should display error and prevent form submission, when both email domain name and description is blank', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()

    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()
    const emailDomainCreationPage = EmailDomainCreationPage.verifyOnPage()
    emailDomainCreationPage.createEmailDomainPage('', '')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain description')
    emailDomainCreationPage.errorSummary().should('contain.text', 'Enter a domain name')
  })

  it('Should navigate to email domain listing, on-clicking the  cancel create email domain button', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_EMAIL_DOMAINS' }] })
    cy.signIn()
    cy.task('stubAllEmailDomains', {})
    MenuPage.verifyOnPage().viewEmailDomainListing()

    const emailDomainListingPage = EmailDomainListingPage.verifyOnPage()
    emailDomainListingPage.navigateToCreateEmailDomainPageButton().click()

    const emailDomainCreationPage = EmailDomainCreationPage.verifyOnPage()
    emailDomainCreationPage.cancel()
    emailDomainListingPage.emailDomainListingTableRows().should('have.length', 3)
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN1')
    emailDomainListingPage.emailDomainListingTableRows().eq(0).should('include.text', 'DOMAIN 1 DESCRIPTION')
  })
})
