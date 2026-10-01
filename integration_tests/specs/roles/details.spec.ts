import { expect, test } from '@playwright/test'

import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { gotoRoleDetails } from '../../helpers/roles'
import ChangeRoleNamePage from '../../pages/roles/changeRoleNamePage'
import RoleDetailsPage from '../../pages/roles/roleDetailsPage'
import ChangeRoleDescriptionPage from '../../pages/roles/changeRoleDescriptionPage'
import ChangeRoleAdminTypePage from '../../pages/roles/changeRoleAdminTypePage'

const completeRole = {
  roleName: 'Test role name',
  roleCode: 'TEST_ROLE_CODE',
  roleDescription: 'Test role description',
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
}

const getChangeRoleNameRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/roles/.*',
  })
}

const getChangeRoleDescriptionRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/roles/.*/description',
  })
}

const getChangeRoleAdminTypeRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/roles/.*/admintype',
  })
}

test.describe('Role Details', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows role details including edit functionality when logged in as roles admin', async ({ page }) => {
    const roleDetailsPage = await gotoRoleDetails(page, {
      roles: [AuthRole.ROLES_ADMIN],
      role: completeRole,
    })

    await expect(roleDetailsPage.headerRows.first()).toHaveText('Test role name Change role name')
    await expect(roleDetailsPage.detailsRows).toHaveCount(2)
    await expect(roleDetailsPage.detailsRows.first()).toHaveText('Role code TEST_ROLE_CODE')
    await expect(roleDetailsPage.detailsRows.nth(1)).toHaveText(
      'Role description Test role description Change role description',
    )
    await expect(roleDetailsPage.adminTypeHeaderRows.first()).toHaveText('Admin type Change role admin type')
    await expect(roleDetailsPage.adminTypeRows).toHaveCount(3)
    await expect(roleDetailsPage.adminTypeRows.first()).toHaveText('External Administrator')
    await expect(roleDetailsPage.adminTypeRows.nth(1)).toHaveText('DPS Central Administrator')
    await expect(roleDetailsPage.adminTypeRows.nth(2)).toHaveText('DPS Local System Administrator')
  })

  test('Shows role details excluding edit functionality when logged in as view administrable roles', async ({
    page,
  }) => {
    const roleDetailsPage = await gotoRoleDetails(page, {
      roles: [AuthRole.VIEW_ADMINISTRABLE_USER_ROLES],
      role: completeRole,
    })

    await expect(roleDetailsPage.headerRows.first()).toHaveText('Test role name')
    await expect(roleDetailsPage.detailsRows).toHaveCount(2)
    await expect(roleDetailsPage.detailsRows.first()).toHaveText('Role code TEST_ROLE_CODE')
    await expect(roleDetailsPage.detailsRows.nth(1)).toHaveText('Role description Test role description')
    await expect(roleDetailsPage.adminTypeHeaderRows.first()).toHaveText('Admin type')
    await expect(roleDetailsPage.adminTypeRows).toHaveCount(3)
    await expect(roleDetailsPage.adminTypeRows.first()).toHaveText('External Administrator')
    await expect(roleDetailsPage.adminTypeRows.nth(1)).toHaveText('DPS Central Administrator')
    await expect(roleDetailsPage.adminTypeRows.nth(2)).toHaveText('DPS Local System Administrator')
  })

  test.describe('Changing the role name', () => {
    test('Shows the change role name screen with the current role name pre-filled', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleNamePage.roleName).toHaveValue('Test role name')
    })

    test('Shows an error if role name is blank', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')

      await changeRoleNamePage.roleName.clear()
      await changeRoleNamePage.submit.click()
      await expect(changeRoleNamePage.errorSummary).toHaveText('There is a problem Enter a role name')
      await expect(changeRoleNamePage.roleName).toHaveValue('')
    })

    test('Shows an error if role name is less than 4 characters', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')

      await changeRoleNamePage.roleName.fill('Tes')
      await changeRoleNamePage.submit.click()
      await expect(changeRoleNamePage.errorSummary).toHaveText(
        'There is a problem Role name must be 4 characters or more',
      )
      await expect(changeRoleNamePage.roleName).toHaveValue('Tes')
    })

    test('Shows an error if role name is more than 100 characters', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')

      await changeRoleNamePage.roleName.fill('x'.repeat(101))
      await changeRoleNamePage.submit.click()
      await expect(changeRoleNamePage.errorSummary).toHaveText(
        'There is a problem Role name must be 100 characters or less',
      )
      await expect(changeRoleNamePage.roleName).toHaveValue('x'.repeat(101))
    })

    test('Shows an error if role name has invalid characters', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')

      await changeRoleNamePage.roleName.fill('*%Test^Role')
      await changeRoleNamePage.submit.click()
      await expect(changeRoleNamePage.errorSummary).toHaveText(
        "There is a problem Role name can only contain 0-9, a-z and ( ) & , - . ' characters",
      )
      await expect(changeRoleNamePage.roleName).toHaveValue('*%Test^Role')
    })

    test('Should fail attempting to change role name if view administrable roles', async ({ page }) => {
      await gotoRoleDetails(page, {
        roles: [AuthRole.VIEW_ADMINISTRABLE_USER_ROLES],
        role: completeRole,
      })
      await page.goto(paths.roles.changeRoleName({ role: 'TEST_ROLE_CODE' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Changes the role name if the new name is valid', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeNameLink.click()

      await manageUsersApi.stubChangeRoleName('TEST_ROLE_CODE', { roleName: 'New role name' })
      const changeRoleNamePage = await ChangeRoleNamePage.verifyOnPage(page, 'Test role name')

      await changeRoleNamePage.roleName.fill('New role name')
      await manageUsersApi.stubRoleDetails({ ...completeRole, roleName: 'New role name' })
      await changeRoleNamePage.submit.click()
      await RoleDetailsPage.verifyOnPage(page, 'New role name')
      const requests = await getChangeRoleNameRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ roleName: 'New role name' })
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.ROLES_ADMIN] })

      await attemptPostWithoutCsrf(page, paths.roles.changeRoleName({ role: 'TEST_ROLE_CODE' }))
    })
  })

  test.describe('Changing the role description', () => {
    test('Shows the change role description screen with the current role description pre-filled', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeDescriptionLink.click()

      const changeRoleDescriptionPage = await ChangeRoleDescriptionPage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleDescriptionPage.roleDescription).toHaveValue('Test role description')
    })

    test('Shows an error if role description is more than 1024 characters', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeDescriptionLink.click()

      const changeRoleDescriptionPage = await ChangeRoleDescriptionPage.verifyOnPage(page, 'Test role name')

      await changeRoleDescriptionPage.roleDescription.fill('x'.repeat(1025))
      await changeRoleDescriptionPage.submit.click()
      await expect(changeRoleDescriptionPage.errorSummary).toHaveText(
        'There is a problem Role description must be 1024 characters or less',
      )
      await expect(changeRoleDescriptionPage.roleDescription).toHaveValue('x'.repeat(1025))
    })

    test('Shows an error if role description has invalid characters', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeDescriptionLink.click()

      const changeRoleDescriptionPage = await ChangeRoleDescriptionPage.verifyOnPage(page, 'Test role name')

      await changeRoleDescriptionPage.roleDescription.fill('*%Test^Description')
      await changeRoleDescriptionPage.submit.click()
      await expect(changeRoleDescriptionPage.errorSummary).toHaveText(
        "There is a problem Role description can only contain 0-9, a-z, newline and ( ) & , - . ' characters",
      )
      await expect(changeRoleDescriptionPage.roleDescription).toHaveValue('*%Test^Description')
    })

    test('Should fail attempting to change role description if view administrable roles', async ({ page }) => {
      await gotoRoleDetails(page, {
        roles: [AuthRole.VIEW_ADMINISTRABLE_USER_ROLES],
        role: completeRole,
      })
      await page.goto(paths.roles.changeRoleDescription({ role: 'TEST_ROLE_CODE' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Changes the role description if the new description is valid', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await roleDetailsPage.changeDescriptionLink.click()

      await manageUsersApi.stubChangeRoleDescription('TEST_ROLE_CODE', { roleDescription: 'New role description' })
      const changeRoleDescriptionPage = await ChangeRoleDescriptionPage.verifyOnPage(page, 'Test role name')

      await changeRoleDescriptionPage.roleDescription.fill('New role description')
      await manageUsersApi.stubRoleDetails({ ...completeRole, roleDescription: 'New role description' })
      await changeRoleDescriptionPage.submit.click()
      const updatedRoleDetailsPage = await RoleDetailsPage.verifyOnPage(page, 'Test role name')
      await expect(updatedRoleDetailsPage.detailsRows.nth(1)).toHaveText(
        'Role description New role description Change role description',
      )
      const requests = await getChangeRoleDescriptionRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ roleDescription: 'New role description' })
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.ROLES_ADMIN] })

      await attemptPostWithoutCsrf(page, paths.roles.changeRoleDescription({ role: 'TEST_ROLE_CODE' }))
    })
  })

  test.describe('Changing the role admin type', () => {
    test('Shows the change role admin type screen with the external admin checkbox pre-checked', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'EXT_ADM',
              adminTypeName: 'External Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.extAdminCheckbox).toBeChecked()
      await expect(changeRoleAdminTypePage.dpsAdminCheckbox).not.toBeChecked()
      await expect(changeRoleAdminTypePage.lsaAdminCheckbox).not.toBeChecked()
    })

    test('Shows the change role admin type screen with the dps admin checkbox pre-checked', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.extAdminCheckbox).not.toBeChecked()
      await expect(changeRoleAdminTypePage.dpsAdminCheckbox).toBeChecked()
      await expect(changeRoleAdminTypePage.lsaAdminCheckbox).not.toBeChecked()
    })

    test('Shows the change role admin type screen with the lsa admin checkbox pre-checked', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.extAdminCheckbox).not.toBeChecked()
      await expect(changeRoleAdminTypePage.dpsAdminCheckbox).not.toBeChecked()
      await expect(changeRoleAdminTypePage.lsaAdminCheckbox).toBeChecked()
    })

    test('Shows the change role admin type screen with the ext admin checkbox enabled if not chosen', async ({
      page,
    }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.extAdminCheckbox).toBeEnabled()
    })

    test('Shows the change role admin type screen with the ext admin checkbox disabled if chosen', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'EXT_ADM',
              adminTypeName: 'External Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.extAdminCheckbox).toBeDisabled()
    })

    test('Shows the change role admin type screen with the dps admin checkbox enabled if not chosen', async ({
      page,
    }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.dpsAdminCheckbox).toBeEnabled()
    })

    test('Shows the change role admin type screen with the dps admin checkbox disabled if chosen', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.dpsAdminCheckbox).toBeDisabled()
    })

    test('Shows the change role admin type screen with the lsa admin checkbox enabled if not chosen', async ({
      page,
    }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.lsaAdminCheckbox).toBeEnabled()
    })

    test('Shows the change role admin type screen with the lsa admin checkbox enabled if chosen', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      })

      await roleDetailsPage.changeAdminTypeLink.click()

      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')
      await expect(changeRoleAdminTypePage.lsaAdminCheckbox).toBeEnabled()
    })

    test('Should fail attempting to change role admin type if view administrable roles', async ({ page }) => {
      await gotoRoleDetails(page, {
        roles: [AuthRole.VIEW_ADMINISTRABLE_USER_ROLES],
        role: completeRole,
      })
      await page.goto(paths.roles.changeRoleAdminType({ role: 'TEST_ROLE_CODE' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Changes the role admin types to include new types checked', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: {
          ...completeRole,
          adminType: [
            {
              adminTypeCode: 'EXT_ADM',
              adminTypeName: 'External Administrator',
            },
          ],
        },
      })

      await expect(roleDetailsPage.adminTypeRows).toHaveCount(1)
      await roleDetailsPage.changeAdminTypeLink.click()

      await manageUsersApi.stubChangeRoleAdminType('TEST_ROLE_CODE', { adminType: ['EXT_ADM', 'DPS_LSA'] })
      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')

      await changeRoleAdminTypePage.lsaAdminCheckbox.check()
      await manageUsersApi.stubRoleDetails({
        ...completeRole,
        adminType: [
          {
            adminTypeCode: 'EXT_ADM',
            adminTypeName: 'External Administrator',
          },
          {
            adminTypeCode: 'DPS_LSA',
            adminTypeName: 'DPS Local System Administrator',
          },
        ],
      })
      await changeRoleAdminTypePage.submit.click()
      const updatedRoleDetailsPage = await RoleDetailsPage.verifyOnPage(page, 'Test role name')
      await expect(updatedRoleDetailsPage.adminTypeRows).toHaveCount(2)
      const requests = await getChangeRoleAdminTypeRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ adminType: ['EXT_ADM', 'DPS_LSA'] })
    })

    test('Changes the role admin types to exclude new types unchecked', async ({ page }) => {
      const roleDetailsPage = await gotoRoleDetails(page, {
        roles: [AuthRole.ROLES_ADMIN],
        role: completeRole,
      })

      await expect(roleDetailsPage.adminTypeRows).toHaveCount(3)
      await roleDetailsPage.changeAdminTypeLink.click()

      await manageUsersApi.stubChangeRoleAdminType('TEST_ROLE_CODE', { adminType: ['EXT_ADM', 'DPS_ADM'] })
      const changeRoleAdminTypePage = await ChangeRoleAdminTypePage.verifyOnPage(page, 'Test role name')

      await changeRoleAdminTypePage.lsaAdminCheckbox.uncheck()
      await manageUsersApi.stubRoleDetails({
        ...completeRole,
        adminType: [
          {
            adminTypeCode: 'EXT_ADM',
            adminTypeName: 'External Administrator',
          },
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
        ],
      })
      await changeRoleAdminTypePage.submit.click()
      const updatedRoleDetailsPage = await RoleDetailsPage.verifyOnPage(page, 'Test role name')
      await expect(updatedRoleDetailsPage.adminTypeRows).toHaveCount(2)
      const requests = await getChangeRoleAdminTypeRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ adminType: ['EXT_ADM', 'DPS_ADM'] })
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.ROLES_ADMIN] })

      await attemptPostWithoutCsrf(page, paths.roles.changeRoleAdminType({ role: 'TEST_ROLE_CODE' }))
    })
  })

  test('Should fail attempting to view role details if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_ROLES_ADMIN'] })

    await page.goto(paths.roles.details({ role: 'TEST_ROLE_CODE' }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to view role details if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.roles.details({ role: 'TEST_ROLE_CODE' }))
    await AuthErrorPage.verifyOnPage(page)
  })
})
