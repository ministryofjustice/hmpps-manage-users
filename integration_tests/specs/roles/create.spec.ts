import { expect, Page, test } from '@playwright/test'

import { Role } from 'manageUsersApiClient'
import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import HomePage from '../../pages/homePage'
import { HttpStatusCode } from '../../../server/utils/utils'
import CreateRolePage from '../../pages/roles/createRolePage'
import RoleDetailsPage from '../../pages/roles/roleDetailsPage'
import RoleListPage from '../../pages/roles/roleListPage'

const gotoCreateRole = async (page: Page) => {
  await login(page, { roles: [AuthRole.ROLES_ADMIN] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_roles_link')
  return CreateRolePage.verifyOnPage(page)
}

const getCreateRoleRequests = async () => {
  return getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/roles',
  })
}

test.describe('Create Role', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows an error if role name is blank', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Enter a role name')
  })

  test('Shows an error if role name is less than 4 characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Tes')
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Role name must be 4 characters or more')
  })

  test('Shows an error if role name is more than 100 characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('x'.repeat(101))
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Role name must be 100 characters or less')
  })

  test('Shows an error if role name has invalid characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('*%Test^Role')
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText(
      "There is a problem Role name can only contain 0-9, a-z and ( ) & , - . ' characters",
    )
  })

  test('Shows an error if role code is blank', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Enter a role code')
  })

  test('Shows an error if role code is less than 2 characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('T')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Role code must be 2 characters or more')
  })

  test('Shows an error if role code is more than 30 characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('X'.repeat(31))
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Role code must be 30 characters or less')
  })

  test('Shows an error if role code has lowercase characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('test_role')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText(
      'There is a problem Role code can only contain 0-9, A-Z and _ characters',
    )
  })

  test('Shows an error if role code has invalid characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('&TEST_ROLE*')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText(
      'There is a problem Role code can only contain 0-9, A-Z and _ characters',
    )
  })

  test('Shows an error if role code already exists', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await manageUsersApi.stubCreateRole(HttpStatusCode.CONFLICT)
    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('EXISTING_TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Role code already exists')
  })

  test('Shows an error if role description is more than 1024 characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('TEST_ROLE_CODE')
    await createRolePage.roleDescription.fill('x'.repeat(1025))
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText(
      'There is a problem Role description must be 1024 characters or less',
    )
  })

  test('Shows an error if role description has invalid characters', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('TEST_ROLE_CODE')
    await createRolePage.roleDescription.fill('&Test description*')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText(
      "There is a problem Role description can only contain 0-9, a-z, newline and ( ) & , - . ' characters",
    )
  })

  test('Shows an error if no admin type selected', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await manageUsersApi.stubCreateRole(HttpStatusCode.CONFLICT)
    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.submit.click()
    await expect(createRolePage.errorSummary).toHaveText('There is a problem Select an admin type')
  })

  test('Creates a role if valid role name, code and admin type entered', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await manageUsersApi.stubCreateRole()
    await manageUsersApi.stubRoleDetails({
      roleName: 'Test role name',
      roleCode: 'TEST_ROLE',
      adminType: ['EXT_ADM'],
    } as Role)
    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.extAdminCheckbox.click()
    await createRolePage.submit.click()

    const requests = await getCreateRoleRequests()
    expect(requests.length).toBe(1)
    expect(JSON.parse(requests[0].body)).toEqual({
      roleCode: 'TEST_ROLE',
      roleName: 'Test role name',
      roleDescription: '',
      adminType: ['EXT_ADM'],
    })

    await RoleDetailsPage.verifyOnPage(page, 'Test role name')
  })

  test('Goes to roles list page if creating a role is cancelled', async ({ page }) => {
    const createRolePage = await gotoCreateRole(page)

    await manageUsersApi.stubPagedRoles({})
    await createRolePage.roleName.fill('Test role name')
    await createRolePage.roleCode.fill('TEST_ROLE')
    await createRolePage.cancel.click()

    await RoleListPage.verifyOnPage(page)
  })

  test('Should fail attempting to create role if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_ROLES_ADMIN'] })

    await page.goto(paths.roles.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create role if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.roles.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.ROLES_ADMIN] })

    await attemptPostWithoutCsrf(page, paths.roles.create.pattern)
  })
})
