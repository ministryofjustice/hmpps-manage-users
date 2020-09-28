const page = require('./page')

const user = () => cy.get('#user')
const submit = () => cy.get('button[type="submit"]')

const authUserSearchPage = () =>
  page('Search for auth user results', {
    user,
    search: (text) => {
      if (text) user().type(text)
      else user().clear()
      submit().click()
    },
    errorSummary: () => cy.get('#error-summary'),
    rows: () => cy.get('table tbody tr'),
    edit: (username) => cy.get(`#edit-button-${username}`).click(),
  })

export default {
  verifyOnPage: authUserSearchPage,
}
