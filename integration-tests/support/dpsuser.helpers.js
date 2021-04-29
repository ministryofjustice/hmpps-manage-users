const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')

export const goToResultsPage = () => {
  cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
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

export const editUser = () => {
  const results = goToResultsPage()

  cy.task('stubDpsUserDetails')
  cy.task('stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  results.edit('ITAG_USER5')
  return UserPage.verifyOnPage('Itag User')
}
