const DpsUserSearchWithFilterPage = require('../pages/dpsUserSearchWithFilterPage')
const UserPage = require('../pages/userPage')
const MenuPage = require('../pages/menuPage')

export const goToSearchWithFilterPage = ({ isAdmin = true, totalElements = 21, size = 10, roleCodes = null }) => {
  const basicRoleCode = isAdmin
    ? [{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }]
    : [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }]
  const userRoleCodes = roleCodes == null ? basicRoleCode : roleCodes

  cy.task('stubBannerNoMessage')
  cy.task('stubSignIn', { roles: userRoleCodes })
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

  return DpsUserSearchWithFilterPage.goTo()
}

export const goToMainMenuPage = ({ isAdmin = true }) => {
  const roleCode = isAdmin ? 'MAINTAIN_ACCESS_ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubBannerMessage')
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  return MenuPage.verifyOnPage()
}

export const editUser = ({ isAdmin = false, roleCodes = null, userEnabled = true }) => {
  cy.task('stubDpsUserDetails', userEnabled)
  cy.task('stubDpsUserGetRoles')
  cy.task('stubBannerNoMessage')
  cy.task('stubEmail', { email: 'ITAG_USER@gov.uk' })

  goToSearchWithFilterPage({ isAdmin, roleCodes }).filterUser('ITAG_USER5').manageLinkForUser('ITAG_USER5').click()
  return UserPage.verifyOnPage('Itag User')
}
