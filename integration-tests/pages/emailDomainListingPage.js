const page = require('./page')

const emailDomainListingTableRows = () => cy.get('table tbody tr')
const createEmailDomainButton = () => cy.get('[href="/create-email-domain"]')
const emailDomainListingPage = () =>
  page('Allowed Email Domain List', {
    emailDomainListingTableRows,
    createEmailDomainButton,
  })

export default {
  verifyOnPage: emailDomainListingPage,
}
