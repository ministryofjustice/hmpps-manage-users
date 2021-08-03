const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')

export const goToResultsPage = (roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }], isAdmin) => {
  cy.task('stubLogin', { roles })
  cy.login()
  cy.task('stubDpsGetRoles', { content: [] })
  cy.task('stubDpsSearch', { totalElements: 21 })
  if (isAdmin) cy.task('stubDpsGetCaseloads')
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchPage.goTo()
  search.search('sometext@somewhere.com')
  const results = UserSearchResultsPage.verifyOnPage()
  results.nextPage()
  return results
}

export const editUser = (roles, isAdmin) => {
  const results = goToResultsPage(roles, isAdmin)

  cy.task('stubDpsUserDetails')
  cy.task(isAdmin ? 'stubDpsUserGetAdminRoles' : 'stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  results.edit('ITAG_USER5')
  return UserPage.verifyOnPage('Itag User')
}
