const page = require('./page')

const authUserAddRolePage = () =>
  page(`Select role`, {
    addRoleButton: () => cy.get('[data-qa="add-button"]'),
    choose: (role) => cy.get('[type="checkbox"]').check(role),
    noRoles: () => cy.get('[data-qa="no-roles"]'),
  })

export default {
  verifyOnPage: authUserAddRolePage,
}
