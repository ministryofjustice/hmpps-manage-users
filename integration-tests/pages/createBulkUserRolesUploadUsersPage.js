const page = require('./page')

const fileUploadHint = () => cy.get('#upload-users-file-hint').should('contain.text', 'The file must')
const fileUploadError = () => cy.get('#upload-users-file-error')
const uploadButton = () => cy.get('#upload-users-file-upload').should('contain.text', 'Upload')
const chooseFile = () => cy.get('#upload-users-file')

const createBulkUserRolesUploadUsersPage = () =>
  page('Upload users', {
    fileUploadHint,
    fileUploadError,
    chooseFile,
    uploadButton,
    assertErrorSummary: () => cy.get('[data-qa-errors]').should('contain.text', 'There was a problem'),
  })

export default {
  verifyOnPage: createBulkUserRolesUploadUsersPage,
  goTo: () => {
    cy.visit('change-roles-in-bulk/upload-users')
    return createBulkUserRolesUploadUsersPage()
  },
}
