const MenuPage = require('../pages/menuPage')
const ExternalUserSearchPage = require('../pages/authUserSearchPage')

export const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    userId: i,
    username: `AUTH_ADM${i}`,
    email: `auth_test${i}@digital.justice.gov.uk`,
    enabled: i % 2 === 0,
    locked: i % 3 === 0,
    verified: i % 5 === 0,
    firstName: 'Auth',
    lastName: `Adm${i}`,
  }))

export const searchForUser = (
  roleCode = 'MAINTAIN_OAUTH_USERS',
  searchContent = undefined,
  assignableGroups = undefined,
) => {
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()
  cy.task('stubAssignableGroups', { content: assignableGroups })
  cy.task('stubExtSearchableRoles', {})
  cy.task('stubAuthSearch', { content: searchContent })

  menuPage.searchExternalUsers()
  return ExternalUserSearchPage.verifyOnPage()
}

export const goToMainMenuPage = () => {
  cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
  cy.signIn()
  return MenuPage.verifyOnPage()
}
