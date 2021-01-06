const page = require('./page')

const groupDetailsPage = () =>
  page('Manage groups', {
    groupRows: () => cy.get('[data-qa="groups"] tbody tr'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
  })

export default {
  verifyOnPage: groupDetailsPage,
}
