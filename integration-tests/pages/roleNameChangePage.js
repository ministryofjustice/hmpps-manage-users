const page = require('./page')

const roleName = () => cy.get('[id="roleName"]')
const submit = () => cy.get('button[type="submit"]')
const cancelButton = () => cy.get('[id="cancel-button"]')

const roleNameChangePage = (role) =>
  page(`Change role name for ${role}`, {
    roleRows: () => cy.get('[data-qa="roles"] tbody tr'),
    cancel: () => {
      cancelButton().click()
    },
    changeName: (text) => {
      if (text) roleName().clear().type(text)
      else roleName().clear()
      submit().click()
    },
  })

export default {
  verifyOnPage: roleNameChangePage,
}
