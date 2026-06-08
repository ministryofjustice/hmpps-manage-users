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
    selectRoles: (roles) => {
      roles.forEach((r) => selectRolesTableRows(r).get(`#SELECT_${r}`).check({ force: true }))
    },
    changeSelectRoleCheckboxValueAndCheck: (target, newValue) => {
      cy.get(`#SELECT_${target}`).invoke('attr', 'value', newValue).check({ force: true })
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
    rowIsChecked: (rowIndex, expected) =>
      selectRolesTableRows()
        .eq(rowIndex)
        .find('input[type="checkbox"]')
        .should(expected ? 'be.checked' : 'not.be.checked'),
  })

export default {
  verifyOnPage: createBulkUserRolesSelectRolesPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk')
    return createBulkUserRolesSelectRolesPage()
  },
}
