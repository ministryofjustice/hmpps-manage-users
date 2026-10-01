import { expect, Page, test } from '@playwright/test'

import { Group } from 'manageUsersApiClient'
import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import HomePage from '../../pages/homePage'
import CreateGroupPage from '../../pages/groups/createGroupPage'
import GroupDetailsPage from '../../pages/groups/groupDetailsPage'
import GroupListPage from '../../pages/groups/groupListPage'
import { HttpStatusCode } from '../../../server/utils/utils'

const gotoCreateGroup = async (page: Page) => {
  await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_groups_link')
  return CreateGroupPage.verifyOnPage(page)
}

const getCreateGroupRequests = async () => {
  return getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/groups',
  })
}

test.describe('Create Group', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows an error if group name is blank', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Enter a group name')
  })

  test('Shows an error if group name is less than 4 characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Tes')
    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Group name must be 4 characters or more')
  })

  test('Shows an error if group name is more than 100 characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('x'.repeat(101))
    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText(
      'There is a problem Group name must be 100 characters or less',
    )
  })

  test('Shows an error if group name has invalid characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('*%Test^Group')
    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText(
      "There is a problem Group name can only contain 0-9, a-z and ( ) & , - . ' characters",
    )
  })

  test('Shows an error if group code is blank', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Enter a group code')
  })

  test('Shows an error if group code is less than 2 characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('T')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Group code must be 2 characters or more')
  })

  test('Shows an error if group code is more than 30 characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('X'.repeat(31))
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Group code must be 30 characters or less')
  })

  test('Shows an error if group code has lowercase characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('test_group')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText(
      'There is a problem Group code can only contain 0-9, A-Z and _ characters',
    )
  })

  test('Shows an error if group code has invalid characters', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('&TEST_GROUP*')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText(
      'There is a problem Group code can only contain 0-9, A-Z and _ characters',
    )
  })

  test('Shows an error if group code already exists', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await manageUsersApi.stubCreateGroup(HttpStatusCode.CONFLICT)
    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('EXISTING_TEST_GROUP')
    await createGroupPage.submit.click()
    await expect(createGroupPage.errorSummary).toHaveText('There is a problem Group code already exists')
  })

  test('Creates a group if valid group name and code entered', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await manageUsersApi.stubCreateGroup()
    await manageUsersApi.stubGroupDetails({
      groupName: 'Test group name',
      groupCode: 'TEST_GROUP',
    } as Group)
    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.submit.click()

    const requests = await getCreateGroupRequests()
    expect(requests.length).toBe(1)
    expect(JSON.parse(requests[0].body)).toEqual({ groupCode: 'TEST_GROUP', groupName: 'Test group name' })

    await GroupDetailsPage.verifyOnPage(page, 'Test group name')
  })

  test('Goes to groups list page if creating a group is cancelled', async ({ page }) => {
    const createGroupPage = await gotoCreateGroup(page)

    await manageUsersApi.stubAssignableGroups()
    await createGroupPage.groupName.fill('Test group name')
    await createGroupPage.groupCode.fill('TEST_GROUP')
    await createGroupPage.cancel.click()

    await GroupListPage.verifyOnPage(page)
  })

  test('Should fail attempting to create group if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_OAUTH_USERS'] })

    await page.goto(paths.groups.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create group if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.groups.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

    await attemptPostWithoutCsrf(page, paths.groups.create.pattern)
  })
})
