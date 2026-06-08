const page = require('./page')

const fileUploadHint = () =>
  cy.get('#upload-users-file-hint').should('contain.text', 'Upload a .csv file of user IDs to assign roles to')

const uploadButton = () => cy.get('#upload-users-file-upload').should('contain.text', 'Upload')

const createBulkUserRolesUploadUsersPage = () =>
  page('Upload users', {
    fileUploadHint,
    uploadButton,
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: createBulkUserRolesUploadUsersPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk/upload-users')
    return createBulkUserRolesUploadUsersPage()
  },
}
