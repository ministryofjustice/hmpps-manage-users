const MenuPage = require('../pages/menuPage')
const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')

export const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `AUTH_ADM${i}`,
    email: `auth_test${i}@digital.justice.gov.uk`,
    enabled: i % 2 === 0,
    locked: i % 3 === 0,
    verified: i % 5 === 0,
    firstName: 'Auth',
    lastName: `Adm${i}`,
  }))

export const searchForUser = (roleCode = 'MAINTAIN_OAUTH_USERS', searchContent = undefined) => {
  cy.task('stubLogin', { roles: [{ roleCode }] })
  cy.login()
  const menuPage = MenuPage.verifyOnPage()
  cy.task('stubAuthAssignableGroups', { content: [] })
  cy.task('stubAuthSearchableRoles', { content: [] })
  menuPage.manageAuthUsers()
  const search = AuthUserSearchPage.verifyOnPage()

  cy.task('stubAuthSearch', { content: searchContent })
  search.search('sometext')

  const results = UserSearchResultsPage.verifyOnPage()
  results.rows().should('have.length', searchContent ? searchContent.length : 1)
  return results
}
