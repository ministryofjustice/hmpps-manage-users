import { expect, test } from '@playwright/test'

import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import { gotoGroupDetails } from '../../helpers/groups'
import ChangeGroupNamePage from '../../pages/groups/changeGroupNamePage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import manageUsersApi from '../../mockApis/manageUsersApi'
import GroupDetailsPage from '../../pages/groups/groupDetailsPage'
import DeleteConfirmationPage from '../../pages/groups/deleteConfirmationPage'
import GroupListPage from '../../pages/groups/groupListPage'

const fullGroupDetails = {
  groupCode: 'TEST_PARENT_GROUP',
  groupName: 'Test Parent Group',
  assignableRoles: [
    {
      roleCode: 'TEST_ROLE',
      roleName: 'Test role',
    },
    {
      roleCode: 'TEST_ADMIN_ROLE',
      roleName: 'Test admin role',
      automatic: true,
    },
  ],
  children: [
    {
      groupCode: 'TEST_CHILD_GROUP_1',
      groupName: 'Test child group one',
    },
    {
      groupCode: 'TEST_CHILD_GROUP_2',
      groupName: 'Test child group two',
    },
  ],
}
const basicGroupDetails = {
  groupCode: 'TEST_PARENT_GROUP',
  groupName: 'Test Parent Group',
}

const getChangeGroupNameRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/groups/.*',
  })
}

const getChangeChildGroupNameRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/groups/child/.*',
  })
}

const getDeleteGroupRequests = async () => {
  return getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/groups/.*',
  })
}

const getDeleteChildGroupRequests = async () => {
  return getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/groups/child/.*',
  })
}

test.describe('Group Details', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows group details including edit functionality when logged in as oauth admin', async ({ page }) => {
    const groupDetailsPage = await gotoGroupDetails(
      page,
      [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
      [AuthRole.MAINTAIN_OAUTH_USERS],
      fullGroupDetails,
    )

    await expect(groupDetailsPage.headerRows.first()).toHaveText(
      'Test Parent Group Change TEST_PARENT_GROUP group name Delete TEST_PARENT_GROUP',
    )
    await expect(groupDetailsPage.detailsRows.first()).toHaveText('Group code TEST_PARENT_GROUP')
    await expect(groupDetailsPage.assignableRolesRows).toHaveCount(2)
    await expect(groupDetailsPage.assignableRolesRows.nth(0)).toHaveText('Test role Manual')
    await expect(groupDetailsPage.assignableRolesRows.nth(1)).toHaveText('Test admin role Automatic')
    await expect(groupDetailsPage.childGroupRows).toHaveCount(2)
    await expect(groupDetailsPage.childGroupRows.nth(0)).toHaveText(
      'Test child group one TEST_CHILD_GROUP_1 Change TEST_CHILD_GROUP_1 group name Delete TEST_CHILD_GROUP_1',
    )
    await expect(groupDetailsPage.childGroupRows.nth(1)).toHaveText(
      'Test child group two TEST_CHILD_GROUP_2 Change TEST_CHILD_GROUP_2 group name Delete TEST_CHILD_GROUP_2',
    )
    await expect(groupDetailsPage.createChildGroupButton).toBeVisible()
  })

  test('Shows group details excluding edit functionality when logged in as group manager', async ({ page }) => {
    const groupDetailsPage = await gotoGroupDetails(
      page,
      [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
      [AuthRole.AUTH_GROUP_MANAGER],
      fullGroupDetails,
    )

    await expect(groupDetailsPage.headerRows.first()).toHaveText('Test Parent Group')
    await expect(groupDetailsPage.detailsRows.first()).toHaveText('Group code TEST_PARENT_GROUP')
    await expect(groupDetailsPage.assignableRolesRows).toHaveCount(2)
    await expect(groupDetailsPage.assignableRolesRows.nth(0)).toHaveText('Test role Manual')
    await expect(groupDetailsPage.assignableRolesRows.nth(1)).toHaveText('Test admin role Automatic')
    await expect(groupDetailsPage.childGroupRows).toHaveCount(2)
    await expect(groupDetailsPage.childGroupRows.nth(0)).toHaveText('Test child group one TEST_CHILD_GROUP_1')
    await expect(groupDetailsPage.childGroupRows.nth(1)).toHaveText('Test child group two TEST_CHILD_GROUP_2')
    await expect(groupDetailsPage.createChildGroupButton).not.toBeVisible()
  })

  test('Shows no assignable roles if none assigned to group', async ({ page }) => {
    const groupDetailsPage = await gotoGroupDetails(
      page,
      [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
      [AuthRole.MAINTAIN_OAUTH_USERS],
      basicGroupDetails,
    )

    await expect(groupDetailsPage.assignableRolesRows).not.toBeVisible()
  })

  test('Shows no child groups if none assigned to group', async ({ page }) => {
    const groupDetailsPage = await gotoGroupDetails(
      page,
      [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
      [AuthRole.MAINTAIN_OAUTH_USERS],
      basicGroupDetails,
    )

    await expect(groupDetailsPage.childGroupRows).not.toBeVisible()
  })

  test.describe('Changing the group name', () => {
    test('Shows the change group name screen with the current group name pre-filled', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()

      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')
      await expect(changeGroupNamePage.groupName).toHaveValue('Test Parent Group')
    })

    test('Shows an error if group name is blank', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')

      await changeGroupNamePage.groupName.clear()
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText('There is a problem Enter a group name')
      await expect(changeGroupNamePage.groupName).toHaveValue('')
    })

    test('Shows an error if group name is less than 4 characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')

      await changeGroupNamePage.groupName.fill('Tes')
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        'There is a problem Group name must be 4 characters or more',
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('Tes')
    })

    test('Shows an error if group name is more than 100 characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')

      await changeGroupNamePage.groupName.fill('x'.repeat(101))
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        'There is a problem Group name must be 100 characters or less',
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('x'.repeat(101))
    })

    test('Shows an error if group name has invalid characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')

      await changeGroupNamePage.groupName.fill('*%Test^Group')
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        "There is a problem Group name can only contain 0-9, a-z and ( ) & , - . ' characters",
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('*%Test^Group')
    })

    test('Should fail attempting to change group name if group manager', async ({ page }) => {
      await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.AUTH_GROUP_MANAGER],
        basicGroupDetails,
      )
      await page.goto(paths.groups.changeGroupName({ group: 'TEST_PARENT_GROUP' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Changes the group name if the new name is valid', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await manageUsersApi.stubChangeGroupName('TEST_PARENT_GROUP', { groupName: 'New group name' })
      await groupDetailsPage.changeNameLink('TEST_PARENT_GROUP').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change group name')

      await changeGroupNamePage.groupName.fill('New group name')
      await changeGroupNamePage.submit.click()
      await GroupDetailsPage.verifyOnPage(page, 'Test Parent Group')
      const requests = await getChangeGroupNameRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ groupName: 'New group name' })
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

      await attemptPostWithoutCsrf(page, paths.groups.changeGroupName({ group: 'TEST_PARENT_GROUP' }))
    })
  })

  test.describe('Changing a child group name', () => {
    test.beforeEach(async () => {
      await manageUsersApi.stubChildGroupDetails({
        groupCode: 'TEST_CHILD_GROUP_1',
        groupName: 'Test child group one',
      })
    })
    test('Shows the change group name screen with the current group name pre-filled', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()

      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')
      await expect(changeGroupNamePage.groupName).toHaveValue('Test child group one')
    })

    test('Shows an error if group name is blank', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')

      await changeGroupNamePage.groupName.clear()
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText('There is a problem Enter a group name')
      await expect(changeGroupNamePage.groupName).toHaveValue('')
    })

    test('Shows an error if group name is less than 4 characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')

      await changeGroupNamePage.groupName.fill('Tes')
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        'There is a problem Group name must be 4 characters or more',
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('Tes')
    })

    test('Shows an error if group name is more than 100 characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')

      await changeGroupNamePage.groupName.fill('x'.repeat(101))
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        'There is a problem Group name must be 100 characters or less',
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('x'.repeat(101))
    })

    test('Shows an error if group name has invalid characters', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')

      await changeGroupNamePage.groupName.fill('*%Test^Group')
      await changeGroupNamePage.submit.click()
      await expect(changeGroupNamePage.errorSummary).toHaveText(
        "There is a problem Group name can only contain 0-9, a-z and ( ) & , - . ' characters",
      )
      await expect(changeGroupNamePage.groupName).toHaveValue('*%Test^Group')
    })

    test('Should fail attempting to change child group name if group manager', async ({ page }) => {
      await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.AUTH_GROUP_MANAGER],
        fullGroupDetails,
      )
      await page.goto(
        paths.groups.changeChildGroupName({ group: 'TEST_PARENT_GROUP', childGroup: 'TEST_CHILD_GROUP_1' }),
      )
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Changes the group name if the new name is valid', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await manageUsersApi.stubChangeChildGroupName('TEST_CHILD_GROUP_1', { groupName: 'New group name' })
      await groupDetailsPage.changeNameLink('TEST_CHILD_GROUP_1').click()
      const changeGroupNamePage = await ChangeGroupNamePage.verifyOnPage(page, 'Change child group name')

      await changeGroupNamePage.groupName.fill('New group name')
      await changeGroupNamePage.submit.click()
      await GroupDetailsPage.verifyOnPage(page, 'Test Parent Group')
      const requests = await getChangeChildGroupNameRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual({ groupName: 'New group name' })
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

      await attemptPostWithoutCsrf(
        page,
        paths.groups.changeChildGroupName({ group: 'TEST_PARENT_GROUP', childGroup: 'TEST_CHILD_GROUP_1' }),
      )
    })
  })

  test.describe('Deleting the group', () => {
    test('Shows an error when trying to delete with child groups present', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_PARENT_GROUP').click()
      await expect(groupDetailsPage.errorSummary).toHaveText(
        'There is a problem Group has child groups please delete before trying to delete parent group',
      )
    })

    test('Shows an error if confirmed group is empty when confirming deletion of group', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_PARENT_GROUP').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'group')

      await deleteConfirmationPage.submit.click()
      await expect(deleteConfirmationPage.errorSummary).toHaveText(
        'There is a problem Enter "TEST_PARENT_GROUP" to confirm deletion of group',
      )
    })

    test('Shows an error if confirmed group is different to the expected group when confirming deletion of group', async ({
      page,
    }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_PARENT_GROUP').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'group')

      await deleteConfirmationPage.confirmedGroup.fill('NOT_TEST_PARENT_GROUP')
      await deleteConfirmationPage.submit.click()
      await expect(deleteConfirmationPage.errorSummary).toHaveText(
        'There is a problem Enter "TEST_PARENT_GROUP" to confirm deletion of group',
      )
    })

    test('Deletes the group if confirmed group matches the expected group when confirming deletion of group', async ({
      page,
    }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        basicGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_PARENT_GROUP').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'group')

      await manageUsersApi.stubDeleteGroup('TEST_PARENT_GROUP')
      await deleteConfirmationPage.confirmedGroup.fill('TEST_PARENT_GROUP')
      await deleteConfirmationPage.submit.click()
      const requests = await getDeleteGroupRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/groups/TEST_PARENT_GROUP')

      await GroupListPage.verifyOnPage(page)
    })

    test('Should fail attempting to delete group if group manager', async ({ page }) => {
      await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.AUTH_GROUP_MANAGER],
        basicGroupDetails,
      )
      await page.goto(paths.groups.delete({ group: 'TEST_PARENT_GROUP' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

      await attemptPostWithoutCsrf(page, paths.groups.delete({ group: 'TEST_PARENT_GROUP' }))
    })
  })

  test.describe('Deleting a child group', () => {
    test.beforeEach(async () => {
      await manageUsersApi.stubChildGroupDetails({
        groupCode: 'TEST_CHILD_GROUP_1',
        groupName: 'Test child group one',
      })
    })
    test('Shows an error if confirmed group is empty when confirming deletion of group', async ({ page }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_CHILD_GROUP_1').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'child group')

      await deleteConfirmationPage.submit.click()
      await expect(deleteConfirmationPage.errorSummary).toHaveText(
        'There is a problem Enter "TEST_CHILD_GROUP_1" to confirm deletion of group',
      )
    })

    test('Shows an error if confirmed group is different to the expected group when confirming deletion of group', async ({
      page,
    }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_CHILD_GROUP_1').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'child group')

      await deleteConfirmationPage.confirmedGroup.fill('NOT_TEST_CHILD_GROUP_1')
      await deleteConfirmationPage.submit.click()
      await expect(deleteConfirmationPage.errorSummary).toHaveText(
        'There is a problem Enter "TEST_CHILD_GROUP_1" to confirm deletion of group',
      )
    })

    test('Deletes the group if confirmed group matches the expected group when confirming deletion of group', async ({
      page,
    }) => {
      const groupDetailsPage = await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.MAINTAIN_OAUTH_USERS],
        fullGroupDetails,
      )

      await groupDetailsPage.deleteLink('TEST_CHILD_GROUP_1').click()
      const deleteConfirmationPage = await DeleteConfirmationPage.verifyOnPage(page, 'child group')

      await manageUsersApi.stubDeleteChildGroup('TEST_CHILD_GROUP_1')
      await deleteConfirmationPage.confirmedGroup.fill('TEST_CHILD_GROUP_1')
      await deleteConfirmationPage.submit.click()
      const requests = await getDeleteChildGroupRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/groups/child/TEST_CHILD_GROUP_1')

      await GroupDetailsPage.verifyOnPage(page, 'Test Parent Group')
    })

    test('Should fail attempting to delete group if group manager', async ({ page }) => {
      await gotoGroupDetails(
        page,
        [{ groupCode: 'TEST_PARENT_GROUP', groupName: 'Test Parent Group' }],
        [AuthRole.AUTH_GROUP_MANAGER],
        fullGroupDetails,
      )
      await page.goto(paths.groups.deleteChildGroup({ group: 'TEST_PARENT_GROUP', childGroup: 'TEST_CHILD_GROUP_1' }))
      await AuthErrorPage.verifyOnPage(page)
    })

    test('Should check for CSRF token', async ({ page }) => {
      await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

      await attemptPostWithoutCsrf(
        page,
        paths.groups.deleteChildGroup({ group: 'TEST_PARENT_GROUP', childGroup: 'TEST_CHILD_GROUP_1' }),
      )
    })
  })

  test('Should fail attempting to view group details if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_OAUTH_USERS'] })

    await page.goto(paths.groups.details({ group: 'TEST_PARENT_GROUP' }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to view group details if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.groups.details({ group: 'TEST_PARENT_GROUP' }))
    await AuthErrorPage.verifyOnPage(page)
  })
})
