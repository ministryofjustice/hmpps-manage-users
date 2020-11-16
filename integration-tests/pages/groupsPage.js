const page = require('./page')

const groupsPage = () =>
  page('Manage groups', {
    rows: () => cy.get('.govuk-list li'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
  })

export default {
  verifyOnPage: groupsPage,
}
