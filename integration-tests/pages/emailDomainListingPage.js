const page = require('./page')

const emailDomainListingTableRows = () => cy.get('table tbody tr')
const navigateToCreateEmailDomainPageButton = () => cy.get('[href="/create-email-domain"]')
const emailDomainListingPage = () =>
  page('Allowed Email Domain List', {
    emailDomainListingTableRows,
    navigateToCreateEmailDomainPageButton,
  })

export default {
  verifyOnPage: emailDomainListingPage,
}
