const page = require('./page')

const changeEmailSuccessPage = () =>
  page('Email address changed', {
    email: () => cy.get('[data-qa="email"]'),
    userDetailsLink: () => cy.get('[data-qa="user-details"]'),
  })

export default {
  verifyOnPage: changeEmailSuccessPage,
}
