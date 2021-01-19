const page = require('./page')

const userAddRolePage = () =>
  page(`Select role`, {
    addRoleButton: () => cy.get('[data-qa="add-button"]'),
    choose: (role) => cy.get('[type="checkbox"]').check(role),
    noRoles: () => cy.get('[data-qa="no-roles"]'),
    cancel: () => cy.get('[data-qa="cancel-link"]').click(),
  })

export default {
  verifyOnPage: userAddRolePage,
}
