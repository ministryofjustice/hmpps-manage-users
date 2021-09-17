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

export const goToSearchWithFilterPage = ({ isAdmin = true, totalElements = 21, size = 10 }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  cy.task('stubDpsGetRoles', {
    content: [
      {
        roleCode: 'MAINTAIN_ACCESS_ROLES',
        roleName: 'Maintain Roles',
      },
      {
        roleCode: 'USER_ADMIN',
        roleName: 'User Admin',
      },
      {
        roleCode: 'USER_GENERAL',
        roleName: 'User General',
      },
    ],
  })
  cy.task(isAdmin ? 'stubDpsAdminSearch' : 'stubDpsSearch', { totalElements, size })
  if (isAdmin) cy.task('stubDpsGetCaseloads')
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchWithFilterPage.goTo()
  return search
}

export const editUser = ({ isAdmin = false, fromSearchFilterPage = false, nextPage }) => {
  cy.task('stubDpsUserDetails')
  cy.task(isAdmin ? 'stubDpsUserGetAdminRoles' : 'stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  if (fromSearchFilterPage) {
    goToSearchWithFilterPage({ isAdmin }).filterUser('ITAG_USER5').manageLinkForUser('ITAG_USER5').click()
  } else {
    goToResultsPage({ isAdmin, nextPage }).edit('ITAG_USER5')
  }
  return UserPage.verifyOnPage('Itag User')
}
