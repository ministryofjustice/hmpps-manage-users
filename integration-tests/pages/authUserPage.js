const page = require('./page')

const authUserPage = (user) =>
  page(user, {
    userRows: () => cy.get('[data-qa="user-details"] tbody tr'),
    roleRows: () => cy.get('[data-qa="user-roles"] tbody tr'),
    addRole: () => cy.get('[data-qa="add-role-button"]'),
    removeRole: (role) => cy.get(`[data-qa="remove-button-${role}"]`),
  })

export default {
  verifyOnPage: authUserPage,
}
