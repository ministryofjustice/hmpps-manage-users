const page = require('./page')

const changeUsernameSuccessPage = () =>
  page('Username changed', {
    email: () => cy.get('[data-qa="email"]'),
    userDetailsLink: () => cy.get('[data-qa="user-details"]'),
  })

export default {
  verifyOnPage: changeUsernameSuccessPage,
}
