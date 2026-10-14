import { expect, test } from '@playwright/test'
import { getMatchingRequests, resetStubs } from '../../mockApis/wiremock'
import { editUser } from '../../helpers/externalUser'
import AuthRole from '../../../server/interfaces/authRole'
import AddRolePage from '../../pages/addRolePage'
import AddGroupPage from '../../pages/addGroupPage'
import ChangeEmailPage from '../../pages/changeEmailPage'
import ChangeEmailSuccessPage from '../../pages/changeEmailSuccessPage'
import DeactivateReasonPage from '../../pages/externalUser/deactivateReasonPage'
import SearchExternalUserPage from '../../pages/externalUser/searchPage'
import UserPage from '../../pages/userPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthErrorPage from '../../pages/authErrorPage'
import { attemptPostWithoutCsrf, fillAutocompleteSelect, login } from '../../testUtils'
import paths from '../../../server/routes/paths'

const userId = '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f'

const getAddRoleRequests = async () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/externalusers/.*/roles',
  })

const getRemoveRoleRequests = async () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/externalusers/.*/roles/.*',
  })

const getAddGroupRequests = async () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/externalusers/.*/groups/.*',
  })

const getRemoveGroupRequests = async () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/externalusers/.*/groups/.*',
  })

const getDisableRequests = async () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/externalusers/.*/disable',
  })

const getEnableRequests = async () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/externalusers/.*/enable',
  })

const getChangeEmailRequests = async () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/externalusers/.*/email',
  })

test.describe('Manage external user', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should display details for a user', async ({ page }) => {
    const userPage = await editUser(page)

    await expect(userPage.userRows.nth(0)).toContainText('Username')
    await expect(userPage.userRows.nth(0)).toContainText('AUTH_ADM')
    await expect(userPage.userRows.nth(1)).toContainText('Email')
    await expect(userPage.userRows.nth(1)).toContainText('auth_test2@digital.justice.gov.uk')
    await expect(userPage.roleRows).toHaveCount(2)
    await expect(userPage.roleRows.nth(0)).toContainText('Global Search')
    await expect(userPage.roleRows.nth(1)).toContainText('Licence Responsible Officer')
    await expect(userPage.groupRows).toHaveCount(2)
    await expect(userPage.groupRows.nth(0)).toContainText('Site 1 - Group 1')
    await expect(userPage.groupRows.nth(1)).toContainText('Site 1 - Group 2')
    await expect(userPage.activeCaseloadRow).not.toBeVisible()
    await expect(userPage.caseloadRows).not.toBeVisible()
  })

  test('Should be able to return to search page', async ({ page }) => {
    const userPage = await editUser(page)
    await userPage.searchLink.click()
    await SearchExternalUserPage.verifyOnPage(page)
  })

  test('Should view a user with username equal to email', async ({ page }) => {
    const userPage = await editUser(page, {
      searchContent: [
        {
          userId,
          username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
          email: 'auth_test2@digital.justice.gov.uk',
          enabled: true,
          locked: false,
          verified: false,
          firstName: 'Auth',
          lastName: 'Adm',
          active: true,
        },
      ],
      user: {
        username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
        email: 'auth_test2@digital.justice.gov.uk',
      },
    })

    await expect(userPage.userRows.nth(0)).toContainText('Username / email')
    await expect(userPage.userRows.nth(0)).toContainText('auth_test2@digital.justice.gov.uk')
  })

  test.describe('Add and remove a role from a user', () => {
    test('Should add and remove a role from a user', async ({ page }) => {
      const userPage = await editUser(page)
      await manageUsersApi.stubExternalUserAssignableRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.hintFor('Global Search')).toContainText('Is allowed to search')

      await manageUsersApi.stubExternalUserAddRoles()
      await addRolePage.choose('Licence Vary')
      await addRolePage.confirmButton.click()

      const addRoleRequests = await getAddRoleRequests()
      expect(addRoleRequests.length).toBe(1)
      expect(JSON.parse(addRoleRequests[0].body)).toEqual(['LICENCE_VARY'])

      await manageUsersApi.stubExternalUserRemoveRole()
      await userPage.removeRole('GLOBAL_SEARCH').click()
      const removeRoleRequests = await getRemoveRoleRequests()
      expect(removeRoleRequests.length).toBe(1)
      expect(removeRoleRequests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/roles/GLOBAL_SEARCH`)
    })

    test('Should cancel adding a role', async ({ page }) => {
      const userPage = await editUser(page)
      await manageUsersApi.stubExternalUserAssignableRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await addRolePage.cancelButton.click()
      await UserPage.verifyOnPage(page, 'Auth Adm')
    })

    test('Should display no roles available message', async ({ page }) => {
      const userPage = await editUser(page)
      await manageUsersApi.stubExternalUserAssignableRoles([])
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.noRoles).toContainText('There are no roles available for you to assign.')
    })

    test('Should check for CSRF token adding roles', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.selectRoles({ userId }))
    })

    test('Should check for CSRF token removing role', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.roles.remove({ userId, role: 'GLOBAL_SEARCH' }))
    })
  })

  test.describe('Add and remove a group from a user', () => {
    test('Should add and remove a group from a user', async ({ page }) => {
      const userPage = await editUser(page)
      await userPage.addGroupButton.click()

      const addGroupPage = await AddGroupPage.verifyOnPage(page)
      await manageUsersApi.stubExternalUserAddGroup()
      await fillAutocompleteSelect(addGroupPage.groupSelect, 'SOCU North West')
      await addGroupPage.confirmButton.click()

      const addGroupRequests = await getAddGroupRequests()
      expect(addGroupRequests.length).toBe(1)
      expect(addGroupRequests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/groups/SOC_NORTH_WEST`)

      await manageUsersApi.stubExternalUserRemoveGroup()
      await userPage.removeGroup('SITE_1_GROUP_1').click()

      const removeGroupRequests = await getRemoveGroupRequests()
      expect(removeGroupRequests.length).toBe(1)
      expect(removeGroupRequests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/groups/SITE_1_GROUP_1`)
    })

    test('Should cancel adding a group', async ({ page }) => {
      const userPage = await editUser(page)
      await userPage.addGroupButton.click()
      const addGroupPage = await AddGroupPage.verifyOnPage(page)
      await addGroupPage.cancelButton.click()

      await UserPage.verifyOnPage(page, 'Auth Adm')
    })

    test('Group manager cannot remove group they do not manage', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.AUTH_GROUP_MANAGER],
        assignableGroups: [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }],
      })

      await expect(userPage.removeGroup('SITE_1_GROUP_1')).toBeVisible()
      await expect(userPage.removeGroup('SITE_1_GROUP_2')).not.toBeVisible()
    })

    test('Group manager can remove group they manage', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.AUTH_GROUP_MANAGER],
        assignableGroups: [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }],
      })

      await manageUsersApi.stubExternalUserRemoveGroup()
      await userPage.removeGroup('SITE_1_GROUP_1').click()
      const requests = await getRemoveGroupRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/groups/SITE_1_GROUP_1`)
    })

    test('Group manager sees error when removing last group', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.AUTH_GROUP_MANAGER],
        assignableGroups: [{ groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' }],
      })

      await manageUsersApi.stubExternalUserRemoveGroupLastGroupError()
      await userPage.removeGroup('SITE_1_GROUP_1').click()
      await expect(userPage.errorSummary).toContainText(
        'You are not allowed to remove the last group from this user, please deactivate their account instead',
      )
    })

    test('Group manager sees error when adding group to user they cannot maintain', async ({ page }) => {
      const userPage = await editUser(page, { roles: [AuthRole.AUTH_GROUP_MANAGER] })
      await userPage.addGroupButton.click()
      const addGroupPage = await AddGroupPage.verifyOnPage(page)

      await manageUsersApi.stubExternalUserAddGroupForbidden()
      await fillAutocompleteSelect(addGroupPage.groupSelect, 'SOCU North West')
      await addGroupPage.confirmButton.click()

      await expect(addGroupPage.errorSummary).toContainText(
        'You are not able to maintain this user anymore, user does not belong to any groups you manage',
      )
    })

    test('Should check for CSRF token adding groups', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.selectGroup({ userId }))
    })

    test('Should check for CSRF token removing group', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.groups.remove({ userId, group: 'SITE_1_GROUP_1' }))
    })
  })

  test.describe('Enable and disable a user', () => {
    test('Should disable then enable a user', async ({ page }) => {
      const userPage = await editUser(page)
      await expect(userPage.statusTag).toContainText('Active account')

      await userPage.deactivateAccountLink.click()
      const deactivateReasonPage = await DeactivateReasonPage.verifyOnPage(page)

      await manageUsersApi.stubExternalUserDisable()
      await manageUsersApi.stubGetExternalUser({ enabled: false, active: false, inactiveReason: 'Left' })
      await deactivateReasonPage.reason.fill('Left')
      await deactivateReasonPage.confirmButton.click()

      const disableRequests = await getDisableRequests()
      expect(disableRequests.length).toBe(1)
      expect(disableRequests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/disable`)

      await expect(userPage.statusTag).toContainText('Inactive account')
      await expect(userPage.inactiveReasonRows.first()).toContainText('Left')

      await manageUsersApi.stubExternalUserEnable()
      await manageUsersApi.stubGetExternalUser({ enabled: true, active: true, inactiveReason: undefined })
      await userPage.activateLink.click()

      const enableRequests = await getEnableRequests()
      expect(enableRequests.length).toBe(1)
      expect(enableRequests[0].url).toEqual(`/manage-users-api/externalusers/${userId}/enable`)
    })

    test('Should validate deactivation reason', async ({ page }) => {
      const userPage = await editUser(page)
      await userPage.deactivateAccountLink.click()
      const deactivateReasonPage = await DeactivateReasonPage.verifyOnPage(page)

      await deactivateReasonPage.confirmButton.click()
      await expect(deactivateReasonPage.errorSummary).toContainText(
        'Enter the reason for deactivating the account (minimum 3 characters)',
      )

      await deactivateReasonPage.reason.fill('ab')
      await deactivateReasonPage.confirmButton.click()
      await expect(deactivateReasonPage.errorSummary).toContainText(
        'Enter the reason for deactivating the account (minimum 3 characters)',
      )
    })

    test('Should check for CSRF token activating user', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.activate({ userId }))
    })

    test('Should check for CSRF token deactivation reason submit', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.deactivateReason({ userId }))
    })
  })

  test.describe('Change email', () => {
    test('Should change external user email', async ({ page }) => {
      const userPage = await editUser(page)
      await userPage.changeEmailLink.click()

      const changeEmailPage = await ChangeEmailPage.verifyOnPage(page)
      await changeEmailPage.emailTextBox.fill('a username')
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toContainText('Enter an email address in the correct format')

      await manageUsersApi.stubExternalUserChangeEmail()
      await changeEmailPage.emailTextBox.fill('someone@somewhere.com')
      await changeEmailPage.confirmButton.click()

      const requests = await getChangeEmailRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ email: 'someone@somewhere.com' })

      const successPage = await ChangeEmailSuccessPage.verifyOnPage(page)
      await expect(successPage.email).toContainText('someone@somewhere.com')
      await successPage.continueButton.click()
      await UserPage.verifyOnPage(page, 'Auth Adm')
    })

    test('Should render username changed success when username is an email', async ({ page }) => {
      const userPage = await editUser(page, {
        searchContent: [
          {
            userId,
            username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
            email: 'auth_test2@digital.justice.gov.uk',
            enabled: true,
            locked: false,
            verified: true,
            firstName: 'Auth',
            lastName: 'Adm',
            active: true,
          },
        ],
        user: {
          username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
          email: 'auth_test2@digital.justice.gov.uk',
        },
      })

      await userPage.changeEmailLink.click()
      const changeEmailPage = await ChangeEmailPage.verifyOnPage(page)

      await manageUsersApi.stubExternalUserChangeEmail()
      await changeEmailPage.emailTextBox.fill('someone@somewhere.com')
      await changeEmailPage.confirmButton.click()

      await expect(page.getByRole('heading', { name: 'Username changed' })).toBeVisible()
      await expect(page.getByTestId('email')).toContainText('someone@somewhere.com')
      await page.getByRole('button', { name: 'Continue' }).click()
      await UserPage.verifyOnPage(page, 'Auth Adm')
    })

    test('Should cancel changing email', async ({ page }) => {
      const userPage = await editUser(page)
      await userPage.changeEmailLink.click()
      const changeEmailPage = await ChangeEmailPage.verifyOnPage(page)

      await changeEmailPage.cancelButton.click()
      await UserPage.verifyOnPage(page, 'Auth Adm')
    })

    test('Should check for CSRF token changing email', async ({ page }) => {
      await editUser(page)
      await attemptPostWithoutCsrf(page, paths.externalUser.manage.changeEmail({ userId }))
    })
  })

  test('Should fail attempting to view user details if unauthorised', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.externalUser.manage.details({ userId }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to change email as group manager', async ({ page }) => {
    await login(page, { roles: [AuthRole.AUTH_GROUP_MANAGER] })

    await page.goto(paths.externalUser.manage.changeEmail({ userId }))
    await AuthErrorPage.verifyOnPage(page)
  })
})
