const page = require('./page')

const inputHint = () => cy.get('[id="select-roles-hint"]')
const selectRolesTableRows = () => cy.get('#select-roles-table').find('tbody tr')
const submitButton = () => cy.get('#select-roles-submit')

const createBulkUserRolesSelectRolesPage = () =>
  page('Select Roles', {
    inputHint,
    selectRolesTableRows,
    submitButton,
    selectRolesTableHasRows: (expected) => selectRolesTableRows().should('have.length', expected),
    selectRolesTableRowColumnContains: (row, column, expected) => {
      selectRolesTableRows().eq(row).find('td').eq(column).should('contain.text', expected)
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createBulkUserRolesSelectRolesPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk')
    return createBulkUserRolesSelectRolesPage()
  },
}
