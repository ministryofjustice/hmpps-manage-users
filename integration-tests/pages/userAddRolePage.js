const page = require('./page')

const userAddRolePage = () =>
  page(`Select roles`, {
    addRoleButton: () => cy.get('[data-qa="add-button"]'),
    choose: (role) => cy.get('[type="checkbox"]').check(role),
    noRoles: () => cy.get('[data-qa="no-roles"]'),
    cancel: () => cy.get('[data-qa="cancel-link"]').click(),
    hint: (text) => cy.contains('label', text).next(),
  })

export default {
  verifyOnPage: userAddRolePage,
}
