const page = require('./page')

const createEmailDomain = () => cy.get('button').contains('Add Email Domain')
const emailDomainListingPage = () =>
  page('Allowed Email Domain List', {
    rows: () => cy.get('table tbody tr'),
    createEmailDomain,
  })

export default {
  verifyOnPage: emailDomainListingPage,
}
