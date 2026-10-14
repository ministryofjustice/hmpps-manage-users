import { expect, test } from '@playwright/test'
import { login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { gotoListRoles } from '../../helpers/roles'
import RoleDetailsPage from '../../pages/roles/roleDetailsPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'

const getListRoleRequests = async () => {
  return getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/manage-users-api/roles/paged',
  })
}

test.describe('List Roles', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should display a message if user has no roles', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, { totalElements: 0 })

    await expect(roleListPage.noResultsMessage).toHaveText('No records found matching search criteria.')
  })

  test('Should show filter', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})

    await expect(roleListPage.filter).toBeVisible()
  })

  test('Should paginated roles', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})

    await expect(roleListPage.roleTableCells).toHaveCount(20)
    await expect(roleListPage.roleTableCells.nth(0)).toContainText('Role Name 0')
    await expect(roleListPage.roleTableCells.nth(0)).toContainText('ROLE_CODE_0')
    await expect(roleListPage.roleTableCells.nth(0)).toContainText('Role Description 0')
    await expect(roleListPage.roleTableCells.nth(0)).toContainText('EXT ADMIN')
    await expect(roleListPage.roleTableCells.nth(0)).not.toContainText('DPS ADMIN')
    await expect(roleListPage.roleTableCells.nth(0)).not.toContainText('DPS LSA')
    await expect(roleListPage.roleTableCells.nth(1)).toContainText('Role Name 1')
    await expect(roleListPage.roleTableCells.nth(1)).toContainText('ROLE_CODE_1')
    await expect(roleListPage.roleTableCells.nth(1)).toContainText('Role Description 1')
    await expect(roleListPage.roleTableCells.nth(1)).toContainText('EXT ADMIN')
    await expect(roleListPage.roleTableCells.nth(1)).toContainText('DPS ADMIN')
    await expect(roleListPage.roleTableCells.nth(1)).not.toContainText('DPS LSA')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('Role Name 2')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('ROLE_CODE_2')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('Role Description 2')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('EXT ADMIN')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('DPS ADMIN')
    await expect(roleListPage.roleTableCells.nth(2)).toContainText('DPS LSA')
  })

  test('Can add and remove roleName filter', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})
    await roleListPage.roleNameInput.fill('Role name 2')
    await roleListPage.filterButton.click()
    await expect(roleListPage.roleNameInput).toHaveValue('Role name 2')
    await expect(roleListPage.filterCategoryLink('Role name 2')).toBeVisible()
    expect(page.url()).toContain('roleName=Role+name+2')

    await roleListPage.filterCategoryLink('Role name 2').click()
    await expect(roleListPage.filterCategoryLink('Role name 2')).not.toBeVisible()
    await expect(roleListPage.roleNameInput).toHaveValue('')
  })

  test('Can add and remove roleCode filter', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})
    await roleListPage.roleCodeInput.fill('ROLE_CODE_2')
    await roleListPage.filterButton.click()
    await expect(roleListPage.roleCodeInput).toHaveValue('ROLE_CODE_2')
    await expect(roleListPage.filterCategoryLink('ROLE_CODE_2')).toBeVisible()
    expect(page.url()).toContain('roleCode=ROLE_CODE_2')

    await roleListPage.filterCategoryLink('ROLE_CODE_2').click()
    await expect(roleListPage.filterCategoryLink('ROLE_CODE_2')).not.toBeVisible()
    await expect(roleListPage.roleCodeInput).toHaveValue('')
  })

  test('Can change default All admin type filter', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})
    await expect(roleListPage.adminTypeAllRadio).toBeChecked()

    await roleListPage.adminTypeExtAdminRadio.click()
    await roleListPage.filterButton.click()
    await expect(roleListPage.adminTypeExtAdminRadio).toBeChecked()
    await expect(roleListPage.filterCategoryLink('EXT ADMIN')).toBeVisible()
    expect(page.url()).toContain('adminType=EXT_ADM')

    await roleListPage.adminTypeDpsAdminRadio.click()
    await roleListPage.filterButton.click()
    await expect(roleListPage.adminTypeDpsAdminRadio).toBeChecked()
    await expect(roleListPage.filterCategoryLink('DPS ADMIN')).toBeVisible()
    expect(page.url()).toContain('adminType=DPS_ADM')

    await roleListPage.adminTypeDpsLsaRadio.click()
    await roleListPage.filterButton.click()
    await expect(roleListPage.adminTypeDpsLsaRadio).toBeChecked()
    await expect(roleListPage.filterCategoryLink('DPS LSA')).toBeVisible()
    expect(page.url()).toContain('adminType=DPS_LSA')

    await roleListPage.adminTypeAllRadio.click()
    await roleListPage.filterButton.click()
    await expect(roleListPage.adminTypeAllRadio).toBeChecked()
    await expect(roleListPage.filterCategoryLink('All')).not.toBeVisible()
    expect(page.url()).toContain('adminType=ALL')
  })

  test('Can click through pages while maintaining filter', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {
      totalElements: 101,
      size: 20,
    })

    await roleListPage.roleNameInput.fill('Rol')
    await roleListPage.roleCodeInput.fill('ROLE')
    await roleListPage.adminTypeDpsAdminRadio.click()
    await roleListPage.filterButton.click()

    await expect(roleListPage.paginationResults).toContainText('Showing 1 to 20 of 101 total results')
    await roleListPage.paginationPageLink(5).click()
    await expect(roleListPage.filterCategoryLink('Rol', true)).toBeVisible()
    await expect(roleListPage.filterCategoryLink('ROLE', true)).toBeVisible()
    await expect(roleListPage.filterCategoryLink('DPS ADMIN')).toBeVisible()
  })

  test('Clicking role details link goes to role details page', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})

    await manageUsersApi.stubRoleDetails({
      roleName: 'Role Name 2',
      roleCode: 'ROLE_CODE_2',
      roleDescription: 'Role Description 2',
      adminType: [
        {
          adminTypeCode: 'EXT_ADM',
          adminTypeName: 'External Administrator',
        },
        {
          adminTypeCode: 'DPS_ADM',
          adminTypeName: 'DPS Central Administrator',
        },
        {
          adminTypeCode: 'DPS_LSA',
          adminTypeName: 'DPS Local System Administrator',
        },
      ],
    })

    await roleListPage.roleDetailsLink('ROLE_CODE_2').click()

    await RoleDetailsPage.verifyOnPage(page, 'Role Name 2')
  })

  test('Calls the paged roles api with no filter', async ({ page }) => {
    await gotoListRoles(page, {})

    const requests = await getListRoleRequests()
    expect(requests.length).toBe(1)
    expect(requests[0].queryParams).toEqual({
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
    })
  })

  test('Calls the paged roles api with filter applied', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, {})

    await roleListPage.roleNameInput.fill('Rol')
    await roleListPage.roleCodeInput.fill('ROLE')
    await roleListPage.adminTypeDpsAdminRadio.click()
    await roleListPage.filterButton.click()

    const requests = await getListRoleRequests()
    // expecting two requests, once for the page view and once after applying filter
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      roleName: { key: 'roleName', values: ['Rol'] },
      roleCode: { key: 'roleCode', values: ['ROLE'] },
      adminTypes: { key: 'adminTypes', values: ['DPS_ADM'] },
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
    })
  })

  test('Can view list of roles with view role', async ({ page }) => {
    const roleListPage = await gotoListRoles(page, { roles: [AuthRole.VIEW_ADMINISTRABLE_USER_ROLES] })

    await expect(roleListPage.filter).toBeVisible()
  })

  test('Should fail attempting to list roles if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_ROLES_ADMIN'] })

    await page.goto(paths.roles.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to list roles if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.roles.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
