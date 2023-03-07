const page = require('./page')

const emailDomainNameInput = () => cy.get('[id="domainName"]')
const emailDomainDescriptionInput = () => cy.get('[id="domainDescription"]')
const createEmailDomainButton = () => cy.get('button[type="submit"]')
const createEmailDomainCancelButton = () => cy.get('[id="cancel-button"]')
const emailDomainCreationPage = () =>
  page('Create Email Domain', {
    createEmailDomainPage: (emailDomainNameText, emailDomainDescriptionText) => {
      if (emailDomainNameText) emailDomainNameInput().type(emailDomainNameText)
      else emailDomainNameInput().clear()
      if (emailDomainDescriptionText) emailDomainDescriptionInput().type(emailDomainDescriptionText)
      else emailDomainDescriptionInput().clear()
      createEmailDomainButton().click()
    },
    cancel: () => {
      createEmailDomainCancelButton().click()
    },
    errorSummary: () => cy.get('[data-qa-errors]'),
  })

export default {
  verifyOnPage: emailDomainCreationPage,
}
