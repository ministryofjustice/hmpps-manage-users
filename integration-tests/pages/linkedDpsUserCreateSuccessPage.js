const page = require('./page')

const linkedDpsUserCreateSuccessPage = () =>
  page('DPS user created', {
    userDetailsLink: () => cy.get('[data-qa="user-details"]'),
  })

export default {
  verifyOnPage: linkedDpsUserCreateSuccessPage,
}
