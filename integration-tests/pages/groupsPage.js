const page = require('./page')

const submit = () => cy.get('button[type="submit"]')
const group = () => cy.get('[id="groupCode"]')

const groupsPage = () =>
  page('Manage groups', {
    groupRows: () => cy.get('[data-qa="groups"] tbody tr'),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
    errorSummary: () => cy.get('[data-qa-errors]'),
    searchGroup: (text) => {
      if (text) group().type(`${text}{enter}`)
      else group().clear()
    },
    group,
  })

export default {
  verifyOnPage: groupsPage,
}
