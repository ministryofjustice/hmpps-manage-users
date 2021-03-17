const page = require('./page')

const userAddGroupPage = () =>
  page(`Select group`, {
    addGroupButton: () => cy.get('[data-qa="add-button"]'),
    type: (group) => cy.get('#group').type(group),
    noGroups: () => cy.get('[data-qa="no-groups"]'),
    cancel: () => cy.get('[data-qa="cancel-link"]').click(),
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: userAddGroupPage,
}
