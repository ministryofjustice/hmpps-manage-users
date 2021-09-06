const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const DpsUserSearchWithFilterPage = require('../pages/dpsUserSearchWithFilterPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')

export const goToResultsPage = ({ isAdmin = false, totalElements = 21, nextPage }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  cy.task('stubDpsGetRoles', { content: [] })
  cy.task(isAdmin ? 'stubDpsAdminSearch' : 'stubDpsSearch', { totalElements })
  if (isAdmin) cy.task('stubDpsGetCaseloads')
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchPage.goTo()
  search.search('sometext@somewhere.com')
  const results = UserSearchResultsPage.verifyOnPage()
  if (nextPage) results.nextPage()
  return results
}

export const goToSearchWithFilterPage = ({ isAdmin = false, totalElements = 21, nextPage }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  cy.task('stubDpsGetRoles', { content: [] })
  cy.task(isAdmin ? 'stubDpsAdminSearch' : 'stubDpsSearch', { totalElements })
  if (isAdmin) cy.task('stubDpsGetCaseloads')
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchWithFilterPage.goTo()
  return search
}

export const editUser = ({ isAdmin = false, nextPage }) => {
  const results = goToResultsPage({ isAdmin, nextPage })

  cy.task('stubDpsUserDetails')
  cy.task(isAdmin ? 'stubDpsUserGetAdminRoles' : 'stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  results.edit('ITAG_USER5')
  return UserPage.verifyOnPage('Itag User')
}
