const page = require('./page')

const dpsUserCreateSuccessPage = () =>
  page('DPS user created', {
    email: () => cy.get('[data-qa="email"]'),
    userDetailsLink: () => cy.get('[data-qa="user-details"]'),
  })

export default {
  verifyOnPage: dpsUserCreateSuccessPage,
}
