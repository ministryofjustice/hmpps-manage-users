const page = require('./page')

const errorContinue = () => cy.get('[data-qa="continue-button"]')

const errorPage = () =>
  page('Sorry, there is a problem with the service', {
    errorContinue: () => {
      errorContinue().click()
    },
  })

export default {
  verifyOnPage: errorPage,
}
