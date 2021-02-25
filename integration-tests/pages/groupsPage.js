const page = require('./page')

const groupsPage = () =>
  page('Manage groups', {
    groupRows: () => cy.get('[data-qa="groups"] tbody tr'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: groupsPage,
}
