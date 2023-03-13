const page = require('./page')

const deleteEmailDomainButton = () => cy.get('button[type="submit"]')
const deleteEmailDomainCancelButton = () => cy.get('[id="cancel-button"]')
const emailDomainDeletionPage = () =>
  page('Delete Email Domain', {
    delete: (emailDomainId) => {
      if (emailDomainId) deleteEmailDomainButton().click()
    },
    cancel: () => {
      deleteEmailDomainCancelButton().click()
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: emailDomainDeletionPage,
}
