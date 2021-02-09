const page = require('./page')

const authUserCreateSuccessPage = () =>
  page('External user created', {
    email: () => cy.get('[data-qa="email"]'),
    userDetailsLink: () => cy.get('[data-qa="user-details"]'),
  })

export default {
  verifyOnPage: authUserCreateSuccessPage,
}
