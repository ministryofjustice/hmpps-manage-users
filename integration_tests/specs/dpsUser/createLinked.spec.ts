import { expect, Page, test } from '@playwright/test'

import { fillAutocompleteSelect, login, resetStubs } from '../../testUtils'
import HomePage from '../../pages/homePage'
import SelectUserTypePage from '../../pages/dpsUser/selectUserTypePage'
import ExistingAccountOptionPage from '../../pages/dpsUser/existingAccountOptionPage'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { showCaseloadDropdown, userTypeDisplay, UserTypeKey } from '../../../server/presentation/userType'
import CreateLinkedPage from '../../pages/dpsUser/createLinkedPage'
import CreateLinkedSuccessPage from '../../pages/dpsUser/createLinkedSuccessPage'
import AuthRole from '../../../server/interfaces/authRole'

const gotoCreateLinkedPage = async (page: Page, userType: UserTypeKey) => {
  await login(page, { roles: [AuthRole.CREATE_USER] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('create_dps_user_link')
  const selectUserTypePage = await SelectUserTypePage.verifyOnPage(page)
  await selectUserTypePage.radioButton(userTypeDisplay(userType)).click()
  await selectUserTypePage.submit.click()
  const existingAccountOptionPage = await ExistingAccountOptionPage.verifyOnPage(page, userType)
  await manageUsersApi.stubGetCaseloads()
  await existingAccountOptionPage.radioButton('Yes').click()
  await existingAccountOptionPage.submit.click()
  return CreateLinkedPage.verifyOnPage(page, userType)
}

test.describe('Create Linked DPS user', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show all fields for admin user', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_ADM')
    await expect(createLinkedPage.existingUsername).toBeVisible()
    await expect(createLinkedPage.username).toBeVisible()
    await expect(createLinkedPage.email).toBeVisible()
    await expect(createLinkedPage.firstName).toBeVisible()
    await expect(createLinkedPage.lastName).toBeVisible()
    await expect(createLinkedPage.caseload).not.toBeVisible()
  })

  test('Should show all fields for general user', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await expect(createLinkedPage.existingUsername).toBeVisible()
    await expect(createLinkedPage.username).toBeVisible()
    await expect(createLinkedPage.email).toBeVisible()
    await expect(createLinkedPage.firstName).toBeVisible()
    await expect(createLinkedPage.lastName).toBeVisible()
    await expect(createLinkedPage.caseload).toBeVisible()
  })

  test('Should show all fields for lsa user', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_LSA')
    await expect(createLinkedPage.existingUsername).toBeVisible()
    await expect(createLinkedPage.username).toBeVisible()
    await expect(createLinkedPage.email).toBeVisible()
    await expect(createLinkedPage.firstName).toBeVisible()
    await expect(createLinkedPage.lastName).toBeVisible()
    await expect(createLinkedPage.caseload).toBeVisible()
  })

  test('Should show error if no existing username entered when searching', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await createLinkedPage.search.click()
    await expect(createLinkedPage.errorSummary).toContainText('Enter an existing username')
  })

  test('Should not show error if no new username entered when searching', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await createLinkedPage.search.click()
    await expect(createLinkedPage.errorSummary).not.toContainText('Enter a username')
  })

  test('Should show error if existing username not found when searching', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await manageUsersApi.stubGetDpsUserNotFound('NONEXISTENT')
    await createLinkedPage.existingUsername.fill('NONEXISTENT')
    await createLinkedPage.search.click()
    await expect(createLinkedPage.errorSummary).toContainText('Existing username not found')
  })

  test('Should show 400 error user message if response is 400 when searching', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await manageUsersApi.stubGetDpsUser400Response('NONEXISTENT')
    await createLinkedPage.existingUsername.fill('NONEXISTENT')
    await createLinkedPage.search.click()
    await expect(createLinkedPage.errorSummary).toContainText('Bad request')
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should fill in details from found searched ${userType} user`, async ({ page }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubGetDpsUser({
        username: existingUsername,
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@justice.gov.uk',
      })
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.search.click()
      await expect(createLinkedPage.firstName).toHaveValue('Test')
      await expect(createLinkedPage.lastName).toHaveValue('User')
      await expect(createLinkedPage.email).toHaveValue('test.user@justice.gov.uk')
    })
  })

  test('Should show error if no existing username entered when trying to create', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await createLinkedPage.submit.click()
    await expect(createLinkedPage.errorSummary).toContainText('Enter an existing username')
  })

  test('Should show error if no new username entered when trying to create', async ({ page }) => {
    const createLinkedPage = await gotoCreateLinkedPage(page, 'DPS_GEN')
    await createLinkedPage.submit.click()
    await expect(createLinkedPage.errorSummary).toContainText('Enter a username')
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should show error if existing user already has a linked account when trying to create a ${userType} linked user`, async ({
      page,
    }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubCreateLinkedDpsUser409Response(
        userType,
        'Linked account already exists for this staff member',
      )
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.username.fill('NEW_USER')
      if (showCaseloadDropdown(userType)) {
        await fillAutocompleteSelect(createLinkedPage.caseload, 'Moorland (HMP & YOI)')
      }
      await createLinkedPage.submit.click()
      await expect(createLinkedPage.errorSummary).toContainText('Username already linked to another account')
    })
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should show error if new username already exists when trying to create a ${userType} linked user`, async ({
      page,
    }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubCreateLinkedDpsUser409Response(userType)
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.username.fill('NEW_USER')
      if (showCaseloadDropdown(userType)) {
        await fillAutocompleteSelect(createLinkedPage.caseload, 'Moorland (HMP & YOI)')
      }
      await createLinkedPage.submit.click()
      await expect(createLinkedPage.errorSummary).toContainText('Username already exists')
    })
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should show error if existing username doesn't exist when trying to create a ${userType} linked user`, async ({
      page,
    }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubCreateLinkedDpsUser404Response(userType)
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.username.fill('NEW_USER')
      if (showCaseloadDropdown(userType)) {
        await fillAutocompleteSelect(createLinkedPage.caseload, 'Moorland (HMP & YOI)')
      }
      await createLinkedPage.submit.click()
      await expect(createLinkedPage.errorSummary).toContainText('Username not found')
    })
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should show 400 error user message if response is 400 when trying to create a ${userType} linked user`, async ({
      page,
    }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubCreateLinkedDpsUser400Response(userType)
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.username.fill('NEW_USER')
      if (showCaseloadDropdown(userType)) {
        await fillAutocompleteSelect(createLinkedPage.caseload, 'Moorland (HMP & YOI)')
      }
      await createLinkedPage.submit.click()
      await expect(createLinkedPage.errorSummary).toContainText('Bad request')
    })
  })
  ;[
    { userType: 'DPS_ADM' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_LSA' as UserTypeKey, existingUsername: 'TUSER_GEN' },
    { userType: 'DPS_GEN' as UserTypeKey, existingUsername: 'TUSER_ADM' },
  ].forEach(({ userType, existingUsername }) => {
    test(`Should show create linked user and go to linked success page when creating a ${userType} linked user`, async ({
      page,
    }) => {
      const createLinkedPage = await gotoCreateLinkedPage(page, userType)
      await manageUsersApi.stubCreateLinkedDpsUser(userType, 'NEW_USER')
      await createLinkedPage.existingUsername.fill(existingUsername)
      await createLinkedPage.username.fill('NEW_USER')
      if (showCaseloadDropdown(userType)) {
        await fillAutocompleteSelect(createLinkedPage.caseload, 'Moorland (HMP & YOI)')
      }
      await createLinkedPage.submit.click()
      const createLinkedSuccessPage = await CreateLinkedSuccessPage.verifyOnPage(page)
      await expect(createLinkedSuccessPage.userDetailsLink).toHaveAttribute(
        'href',
        paths.dpsUser.manage.details({ userId: 'NEW_USER' }),
      )
    })
  })

  test('Should fail attempting to create linked dps user if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_CREATE_USER'] })

    await page.goto(paths.dpsUser.createLinkedDpsUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create linked dps user if has other manage users role', async ({ page }) => {
    await login(page, { roles: ['ROLE_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.dpsUser.createLinkedDpsUser.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
