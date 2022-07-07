const page = require('./page')

const userAddCaseloadPage = () =>
  page(`Select caseloads`, {
    addCaseloadButton: () => cy.get('[data-qa="add-button"]'),
    choose: (caseload) => cy.get('[type="checkbox"]').check(caseload),
    noCaseloads: () => cy.get('[data-qa="no-caseloads"]'),
    cancel: () => cy.get('[data-qa="cancel-link"]').click(),
    message: () => cy.get('[data-qa="banner-message"]'),
    userBreadcrumb: (user) => cy.get(`a[href="/manage-dps-users/${user}/details"]`),
  })

export default {
  verifyOnPage: userAddCaseloadPage,
}
