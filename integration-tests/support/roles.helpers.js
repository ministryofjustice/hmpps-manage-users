import menuPage from '../pages/menuPage'

const MenuPage = require('../pages/menuPage')
const RolesPage = require('../pages/rolesPage')

// eslint-disable-next-line import/prefer-default-export
export const replicateRoles = (times) =>
  [...Array(times).keys()].map((i) => ({
    roleName: `Role Name ${i}`,
    roleCode: `rolecode${i}`,
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
  }))

export const goToMainMenuPage = ({ isAdmin = true }) => {
  const roleCode = isAdmin ? 'ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  return MenuPage.verifyOnPage()
}

export const goToViewRoleWithFilterPage = ({ isAdmin = true, totalElements = 21, size = 5 }) => {
  const roleCode = isAdmin ? 'ROLES_ADMIN' : 'MAINTAIN_ACCESS_ROLES'
  cy.task('stubSignIn', { roles: [{ roleCode }] })
  cy.signIn()
  cy.task('stubAllRolesPaged', {
    content: replicateRoles(5),
    totalElements,
    page: 0,
    size,
  })
  const roles = RolesPage.goTo()
  return roles
}
