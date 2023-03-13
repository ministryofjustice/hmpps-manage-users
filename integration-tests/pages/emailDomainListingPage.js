const page = require('./page')

const emailDomainListingTableRows = () => cy.get('table tbody tr')
const navigateToCreateEmailDomainPageButton = () => cy.get('[href="/create-email-domain"]')
const emailDomainDeleteLink = () => cy.contains('tr', 'DOMAIN 1 DESCRIPTION').find('td a')

const emailDomainListingPage = () =>
  page('Allowed Email Domain List', {
    emailDomainListingTableRows,
    navigateToCreateEmailDomainPageButton,
    emailDomainDeleteLink,
  })

export default {
  verifyOnPage: emailDomainListingPage,
}
