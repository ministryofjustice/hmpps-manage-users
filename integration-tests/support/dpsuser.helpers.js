const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')

export const goToResultsPage = (roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }]) => {
  cy.task('stubLogin', { roles })
  cy.login()
  cy.task('stubDpsGetRoles', { content: [] })
  cy.task('stubDpsSearch', { totalElements: 21 })
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchPage.goTo()
  search.search('sometext@somewhere.com')
  const results = UserSearchResultsPage.verifyOnPage()
  results.nextPage()
  return results
}

export const editUser = (roles) => {
  const results = goToResultsPage(roles)

  cy.task('stubDpsUserDetails')
  cy.task('stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  results.edit('ITAG_USER5')
  return UserPage.verifyOnPage('Itag User')
}
