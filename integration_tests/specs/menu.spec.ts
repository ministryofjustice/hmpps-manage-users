import { expect, test } from '@playwright/test'
import manageUsersApi from '../mockApis/manageUsersApi'

import { login, resetStubs } from '../testUtils'
import HomePage from '../pages/homePage'
import paths from '../../server/routes/paths'
import AuthRole from '../../server/interfaces/authRole'

test.describe('Menu', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', '')
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Banner text is displayed if the user has MAINTAIN_ACCESS_ROLES role', async ({ page }) => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', 'The service is being tested')
    await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.bannerMessage).toBeVisible()
    await expect(homePage.bannerMessage).toHaveText('Important The service is being tested')
  })

  test('Banner text is displayed if the user has MAINTAIN_ACCESS_ROLES_ADMIN role', async ({ page }) => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', 'The service is being tested')
    await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.bannerMessage).toBeVisible()
    await expect(homePage.bannerMessage).toHaveText('Important The service is being tested')
  })

  test('Banner text is not displayed if the user has other role', async ({ page }) => {
    await manageUsersApi.stubNotificationBannerMessage('DPSMENU', 'The service is being tested')
    await login(page, { roles: [AuthRole.CREATE_USER] })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.bannerMessage).not.toBeVisible()
  })

  test('Banner text is not displayed if their is no message', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.bannerMessage).not.toBeVisible()
  })

  test('User with no roles is presented with the no admin functions message', async ({ page }) => {
    await login(page)

    const homePage = await HomePage.verifyOnPage(page)
    await expect(homePage.noAdminFunctionsMessage).toBeVisible()
    await expect(homePage.noAdminFunctionsMessage).toHaveText(
      'There are no admin functions associated with your account.',
    )
  })

  test('User with MAINTAIN_ACCESS_ROLES is presented with the Search for a DPS user tile', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      'Search for a DPS user',
      'Enhanced searching and managing of DPS and NOMIS users',
      paths.dpsUser.search.pattern,
      'search_with_filter_dps_users',
    )
  })

  test('User with MAINTAIN_ACCESS_ROLES_ADMIN is presented with the Search for a DPS user tile', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      'Search for a DPS user',
      'Enhanced searching and managing of DPS and NOMIS users',
      paths.dpsUser.search.pattern,
      'search_with_filter_dps_users',
    )
  })

  test('User with CREATE_USER is presented with the Create a DPS user tile', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      `Create a DPS user`,
      `Create an account for a DPS user`,
      paths.dpsUser.createUser.pattern,
      'create_dps_user_link',
    )
  })

  test('User with MAINTAIN_EMAIL_DOMAINS is presented with the Manage email domains tile', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      `Manage Email Domains`,
      `Create, Delete and View email domain listing`,
      paths.emailDomains.list.pattern,
      'view_email_domains_link',
    )
  })

  test('User with MAINTAIN_OAUTH_USERS is presented with 4 tiles for the role', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(4)
    await homePage.verifyTile(
      `Search for an external user`,
      `Search for users that typically do not have a DPS or Delius account`,
      paths.externalUser.search.pattern,
      'maintain_auth_users_link',
    )
    await homePage.verifyTile(
      `Create an external user`,
      `Create an account for people who do not have a DPS or Delius account`,
      paths.externalUser.create.pattern,
      'create_auth_user_link',
    )
    await homePage.verifyTile(
      `View the groups I administer`,
      `View and make changes to a group which contain users outside of HMPPS`,
      paths.groups.list.pattern,
      'manage_groups_link',
    )
    await homePage.verifyTile(
      `Create a group`,
      `Create a new group which will represent a cohort of users outside of HMPPS`,
      paths.groups.create.pattern,
      'create_groups_link',
    )
  })

  test('User with AUTH_GROUP_MANAGER is presented with 3 tiles for the role', async ({ page }) => {
    await login(page, { roles: [AuthRole.AUTH_GROUP_MANAGER] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(3)
    await homePage.verifyTile(
      `Search for an external user`,
      `Search for users that typically do not have a DPS or Delius account`,
      paths.externalUser.search.pattern,
      'maintain_auth_users_link',
    )
    await homePage.verifyTile(
      `Create an external user`,
      `Create an account for people who do not have a DPS or Delius account`,
      paths.externalUser.create.pattern,
      'create_auth_user_link',
    )
    await homePage.verifyTile(
      `View the groups I administer`,
      `View and make changes to a group which contain users outside of HMPPS`,
      paths.groups.list.pattern,
      'manage_groups_link',
    )
  })

  test('User with ROLES_ADMIN is presented with 2 tiles for the role', async ({ page }) => {
    await login(page, { roles: [AuthRole.ROLES_ADMIN] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(2)
    await homePage.verifyTile(
      `View roles`,
      `View roles that are available to be assigned to users`,
      paths.roles.list.pattern,
      'view_roles_link',
    )
    await homePage.verifyTile(
      `Create a role`,
      `Create a new role that can later be assigned to users`,
      paths.roles.create.pattern,
      'create_roles_link',
    )
  })

  test('User with VIEW_ADMINISTRABLE_USER_ROLES is presented with the view roles tile', async ({ page }) => {
    await login(page, { roles: ['ROLE_VIEW_ADMINISTRABLE_USER_ROLES'] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      `View roles`,
      `View roles that are available to be assigned to users`,
      paths.roles.list.pattern,
      'view_roles_link',
    )
  })

  test('User with MANAGE_USER_ALLOW_LIST is presented with the 2 tiles for the role', async ({ page }) => {
    await login(page, { roles: ['ROLE_MANAGE_USER_ALLOW_LIST'] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(2)
    await homePage.verifyTile(
      `Search the Test allow list`,
      `Search for a user and update their access to Test`,
      '/user-allow-list',
      'search_user_allow_list',
    )
    await homePage.verifyTile(
      `Add a user to the Test allow list`,
      `Add an existing user to the Test allow list`,
      '/user-allow-list/add',
      'add_user_to_allow_list',
    )
  })

  test('User with CONTRACT_MANAGER_VIEW_GROUP is presented with the Download CRS Group members tile', async ({
    page,
  }) => {
    await login(page, { roles: [AuthRole.CONTRACT_MANAGER_VIEW_GROUP] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(1)
    await homePage.verifyTile(
      `Download CRS Group members`,
      `Select CRS Group and download list of members`,
      paths.crsGroups.select.pattern,
      'view_crs_group_users_link',
    )
  })

  test('User with MANAGE_USER_BULK_JOBS is presented with 2 tiles for the role', async ({ page }) => {
    await login(page, { roles: [AuthRole.MANAGE_USER_BULK_JOBS] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(2)
    await homePage.verifyTile(
      `Change user roles in bulk`,
      `Add roles to a list of users in bulk via a Jira reference and a csv file of user ids`,
      paths.bulkUserRoles.create.root.pattern,
      'create_bulk_user_roles_link',
    )
    await homePage.verifyTile(
      `View bulk role changes`,
      `View the progress and results of bulk user role addition requests`,
      paths.bulkUserRoles.view.list.pattern,
      'view_bulk_user_roles_link',
    )
  })

  test('User with multiple roles is presented with all tiles for their roles', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.ROLES_ADMIN, 'ROLE_MANAGE_USER_ALLOW_LIST'] })

    const homePage = await HomePage.verifyOnPage(page)
    await homePage.verifyTileCount(8)
  })
})
