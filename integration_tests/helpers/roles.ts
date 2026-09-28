import { Page } from '@playwright/test'
import { Role } from 'manageUsersApiClient'
import { login } from '../testUtils'
import AuthRole from '../../server/interfaces/authRole'
import manageUsersApi from '../mockApis/manageUsersApi'
import HomePage from '../pages/homePage'
import RoleListPage from '../pages/roles/roleListPage'
import RoleDetailsPage from '../pages/roles/roleDetailsPage'

export const gotoListRoles = async (
  page: Page,
  {
    roles = [AuthRole.ROLES_ADMIN],
    totalElements = 21,
    size = 20,
    content,
  }: {
    roles?: AuthRole[]
    totalElements?: number
    size?: number
    content?: Role[]
  },
) => {
  await login(page, { roles })

  await manageUsersApi.stubPagedRoles({ totalElements, size, content })
  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('view_roles_link')
  return RoleListPage.verifyOnPage(page)
}

export const gotoRoleDetails = async (
  page: Page,
  {
    roles = [AuthRole.ROLES_ADMIN],
    role,
  }: {
    roles?: AuthRole[]
    role?: Role
  },
) => {
  const roleListPage = await gotoListRoles(page, { roles, content: [role] })

  await manageUsersApi.stubRoleDetails(role)

  await roleListPage.roleDetailsLink(role.roleCode).click()
  return RoleDetailsPage.verifyOnPage(page, role.roleName)
}
