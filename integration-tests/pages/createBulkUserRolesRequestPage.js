const page = require('./page')

const jiraReferenceInput = () => cy.get('#jira-reference-input')
const submitJiraReference = () => cy.get('#submit-jira-reference')

const createBulkUserRolesRequestPage = () =>
  page('Change user roles in bulk', {
    jiraReferenceInput,
    submitJiraReference,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createBulkUserRolesRequestPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk')
    return createBulkUserRolesRequestPage()
  },
}
