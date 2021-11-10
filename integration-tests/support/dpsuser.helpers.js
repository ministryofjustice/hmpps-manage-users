const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const DpsUserSearchWithFilterPage = require('../pages/dpsUserSearchWithFilterPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const MenuPage = require('../pages/menuPage')

export const goToResultsPage = ({ isAdmin = false, totalElements = 21, nextPage }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  cy.task(isAdmin ? 'stubManageUserGetAdminRoles' : 'stubManageUserGetRoles', { content: [] })
  cy.task(isAdmin ? 'stubDpsAdminSearch' : 'stubDpsSearch', { totalElements })
  if (isAdmin) cy.task('stubDpsGetPrisons')
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
  const stubRoles = isAdmin ? 'stubManageUserGetAdminRoles' : 'stubManageUserGetRoles'

  cy.task(stubRoles, {
    content: [
      {
        roleCode: 'MAINTAIN_ACCESS_ROLES',
        roleName: 'Maintain Roles',
        roleDescription: 'Maintaining roles for everyone',
        adminType: [
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
        ],
      },
      {
        roleCode: 'USER_ADMIN',
        roleName: 'User Admin',
        roleDescription: null,
        adminType: [
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
        ],
      },
      {
        roleCode: 'USER_GENERAL',
        roleName: 'User General',
        adminType: [
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
          {
            adminTypeCode: 'DPS_LSA',
            adminTypeName: 'DPS Local System Administrator',
          },
        ],
      },
    ],
  })
  cy.task('stubDpsFindUsers', { totalElements, size })
  if (isAdmin) cy.task('stubDpsGetCaseloads')
  cy.task('stubAuthUserEmails')

  const search = DpsUserSearchWithFilterPage.goTo()
  return search
}

export const goToMainMenuPage = ({ isAdmin = true }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  return MenuPage.verifyOnPage()
}

export const editUser = ({ isAdmin = false, fromSearchFilterPage = false, nextPage }) => {
  cy.task('stubDpsUserDetails')
  cy.task('stubDpsUserGetRoles')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  if (fromSearchFilterPage) {
    goToSearchWithFilterPage({ isAdmin }).filterUser('ITAG_USER5').manageLinkForUser('ITAG_USER5').click()
  } else {
    goToResultsPage({ isAdmin, nextPage }).edit('ITAG_USER5')
  }
  return UserPage.verifyOnPage('Itag User')
}
