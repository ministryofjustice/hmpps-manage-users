const page = require('./page')

const authUserAddRolePage = (user) =>
  page(`Add role: ${user}`, {
    addRoleButton: () => cy.get('[data-qa="add-button"]'),
    choose: (role) => cy.get('#role').select(role),
  })

export default {
  verifyOnPage: authUserAddRolePage,
}
