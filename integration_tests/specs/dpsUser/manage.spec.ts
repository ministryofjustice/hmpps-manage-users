import { expect, Page, test } from '@playwright/test'
import { getMatchingRequests, resetStubs } from '../../mockApis/wiremock'
import { editUser } from '../../helpers/dpsUser'
import AuthRole from '../../../server/interfaces/authRole'
import ChangeEmailPage from '../../pages/changeEmailPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import ChangeEmailSuccessPage from '../../pages/changeEmailSuccessPage'
import UserPage from '../../pages/userPage'
import paths from '../../../server/routes/paths'
import AddRolePage from '../../pages/addRolePage'
import RequestRoleRemovalPage from '../../pages/dpsUser/requestRoleRemovalPage'
import AddUserCaseloadPage from '../../pages/addUserCaseloadPage'
import AuthErrorPage from '../../pages/authErrorPage'
import { attemptPostWithoutCsrf, login } from '../../testUtils'

const getDpsAddUserRoleRequests = async () => {
  return getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/prisonusers/.*/roles',
  })
}

const getDpsRemoveUserRoleRequests = async () => {
  return getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/prisonusers/.*/roles/.*',
  })
}

const getDpsRemoveUserCaseloadRequests = async () => {
  return getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/prisonusers/.*/caseloads/.*',
  })
}

const getDpsAddUserCaseloadRequests = async () => {
  return getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/prisonusers/.*/caseloads',
  })
}

const getDpsUserDisableRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/prisonusers/.*/disable-user',
  })
}

const getDpsUserEnableRequests = async () => {
  return getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/manage-users-api/prisonusers/.*/enable-user',
  })
}

test.describe('Manage a DPS user', () => {
  test.beforeEach(async () => {})

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should display details for a user as admin', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
    })
    await expect(userPage.userRows.nth(0)).toHaveText('Username ITAG_USER5')
    await expect(userPage.userRows.nth(1)).toHaveText('Email ITAG_USER@gov.uk Change email')
    await expect(userPage.userRows.nth(2)).toHaveText('Verified Yes')
    await expect(userPage.userRows.nth(3)).toHaveText('Last logged in 25 December 2023 - 12:57:50')
    await expect(userPage.roleRows).toHaveCount(2)
    await expect(userPage.roleRows.nth(0)).toHaveText('Maintain Roles Remove role')
    await expect(userPage.roleRows.nth(1)).toHaveText('Another general role Remove role')
    await expect(userPage.activeCaseloadRow).toHaveCount(1)
    await expect(userPage.activeCaseloadRow.nth(0)).toHaveText('Moorland')
    await expect(userPage.caseloadRows).toHaveCount(3)
    await expect(userPage.caseloadRows.nth(0)).toHaveText('Leeds (HMP) Remove caseload')
    await expect(userPage.caseloadRows.nth(1)).toHaveText('Moorland')
    await expect(userPage.caseloadRows.nth(2)).toHaveText('Pentonville (HMP) Remove caseload')
    await expect(userPage.addCaseloadButton).toBeVisible()
  })

  test('Should display details for a user as non-admin', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
    })
    await expect(userPage.userRows.nth(0)).toHaveText('Username ITAG_USER5')
    await expect(userPage.userRows.nth(1)).toHaveText('Email ITAG_USER@gov.uk')
    await expect(userPage.userRows.nth(2)).toHaveText('Verified Yes')
    await expect(userPage.userRows.nth(3)).toHaveText('Last logged in 25 December 2023 - 12:57:50')
    await expect(userPage.roleRows).toHaveCount(2)
    await expect(userPage.roleRows.nth(0)).toHaveText('Maintain Roles Remove role')
    await expect(userPage.roleRows.nth(1)).toHaveText('Another general role Remove role')
    await expect(userPage.activeCaseloadRow).toHaveCount(1)
    await expect(userPage.activeCaseloadRow.nth(0)).toHaveText('Moorland')
    await expect(userPage.caseloadRows).toHaveCount(3)
    await expect(userPage.caseloadRows.nth(0)).toHaveText('Leeds (HMP)')
    await expect(userPage.caseloadRows.nth(1)).toHaveText('Moorland')
    await expect(userPage.caseloadRows.nth(2)).toHaveText('Pentonville (HMP)')
    await expect(userPage.addCaseloadButton).not.toBeVisible()
  })

  test('Should not display caseload details for a user with no caseloads', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      userCaseloads: {
        isAdmin: false,
        activeCaseload: false,
        userCaseloads: {
          username: 'ITAG_USER',
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland',
          },
          caseloads: [],
        },
      },
    })
    await expect(userPage.activeCaseloadRow).not.toBeVisible()
    await expect(userPage.caseloadRows).not.toBeVisible()
  })

  test('Should display LAs administered for a user', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      administratorOfUserGroups: [
        { id: 'BXI', name: 'Brixton' },
        { id: 'MDI', name: 'Moorland' },
      ],
    })
    await expect(userPage.administeredUserGroupsRows).toHaveCount(2)
    await expect(userPage.administeredUserGroupsRows.nth(0)).toContainText('Brixton')
    await expect(userPage.administeredUserGroupsRows.nth(1)).toContainText('Moorland')
  })

  test('Should not display LAs administered details for a user with no LAs', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
    })
    await expect(userPage.administeredUserGroupsRows).not.toBeVisible()
  })

  test('Should leave email blank if no email for user', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      email: '',
    })
    await expect(userPage.userRows.nth(1)).toHaveText('Email Change email')
  })

  test('Should show unverified if email is unverified', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      emailVerified: false,
    })
    await expect(userPage.userRows.nth(2)).toHaveText('Verified No')
  })

  test('Should show Email change awaiting verification if new email is not yet confirmed', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      email: 'ITAG_USER@gov.uk',
      emailToVerify: 'bob@gov.uk',
      emailVerified: false,
    })
    await expect(userPage.userRows.nth(1)).toHaveText('Email ITAG_USER@gov.uk Change email')
    await expect(userPage.userRows.nth(2)).toHaveText('Email change awaiting verification bob@gov.uk')
    await expect(userPage.userRows.nth(3)).toHaveText('Last logged in 25 December 2023 - 12:57:50')
  })

  test('Should fail attempting to view user details if unauthorised', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.dpsUser.manage.details({ userId: 'ITAG_USER5' }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test.describe('Change an email address', () => {
    const changeEmail = async (page: Page) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await userPage.changeEmailLink.click()
      return ChangeEmailPage.verifyOnPage(page)
    }
    test('Should have the existing email pre-filled', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await expect(changeEmailPage.emailTextBox).toHaveValue('ITAG_USER@gov.uk')
    })

    test('Should show an error if no email address is provided', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await changeEmailPage.emailTextBox.clear()
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText('There is a problem Enter an email address')
    })

    test('Should show an error if email entered is invalid format', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await changeEmailPage.emailTextBox.fill('usernameNotEmail')
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText(
        'There is a problem Enter an email address in the correct format, like first.last@justice.gov.uk',
      )
    })

    test('Should show an error if email has invalid characters', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await changeEmailPage.emailTextBox.fill('email@invalid!£$%characters.com')
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText(
        "There is a problem Email address can only contain 0-9, a-z, @, ', _, ., - and + characters",
      )
    })

    test('Should show an error if email is longer than 240 characters', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await changeEmailPage.emailTextBox.fill(`${'X'.repeat(100)}@${'Y'.repeat(125)}.justice.gov.uk`)
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText(
        'There is a problem Email address must be 240 characters or less',
      )
    })

    test('Should show an error if email domain is not registered', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await manageUsersApi.stubDpsUserChangeEmailInvalidDomain()
      await changeEmailPage.emailTextBox.fill('email@notaregistereddomain.com')
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText(
        'There is a problem The email domain is not allowed. Enter a work email address',
      )
    })

    test('Should show an error if email already assigned to a user', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await manageUsersApi.stubDpsUserChangeEmailAlreadyAssigned()
      await changeEmailPage.emailTextBox.fill('alreadyassigned@justice.gov.uk')
      await changeEmailPage.confirmButton.click()
      await expect(changeEmailPage.errorSummary).toHaveText(
        'There is a problem This email address is already assigned to a different user',
      )
    })

    test('Should cancel changing email', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await manageUsersApi.stubDpsUserChangeEmail()
      await changeEmailPage.emailTextBox.fill('newemail@justice.gov.uk')
      await changeEmailPage.cancelButton.click()
      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Should change email successfully', async ({ page }) => {
      const changeEmailPage = await changeEmail(page)
      await manageUsersApi.stubDpsUserChangeEmail()
      await changeEmailPage.emailTextBox.fill('newemail@justice.gov.uk')
      await changeEmailPage.confirmButton.click()
      const changeEmailSuccessPage = await ChangeEmailSuccessPage.verifyOnPage(page)
      await expect(changeEmailSuccessPage.email).toContainText('newemail@justice.gov.uk')
      await changeEmailSuccessPage.continueButton.click()
      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Should check for CSRF token', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })
      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.changeEmail({ userId: 'ITAG_USER5' }))
    })

    test('Should fail attempting to change email if unauthorised', async ({ page }) => {
      await login(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

      await page.goto(paths.dpsUser.manage.changeEmail({ userId: 'ITAG_USER5' }))
      await AuthErrorPage.verifyOnPage(page)
    })
  })

  test.describe('Selecting roles', () => {
    test('Should display a banner message if set', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', 'Test roles message')
      await manageUsersApi.stubLsaDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.bannerMessage).toHaveText('Important Test roles message')
    })

    test('Should not display a banner message if empty', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', '')
      await manageUsersApi.stubLsaDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.bannerMessage).not.toBeVisible()
    })

    test('Should add and remove a role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', '')
      await manageUsersApi.stubLsaDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.hintFor('User Admin')).toHaveText('Administering users')
      await expect(addRolePage.hintFor('Another admin role')).toHaveText('Some text for another Admin Role')

      await manageUsersApi.stubDpsAddUserRoles()
      await addRolePage.choose('User Admin')
      await addRolePage.confirmButton.click()

      const requests = await getDpsAddUserRoleRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual(['USER_ADMIN'])

      await UserPage.verifyOnPage(page, 'Itag User')

      await manageUsersApi.stubDpsRemoveUserRole()
      await userPage.removeRole('ANOTHER_GENERAL_ROLE').click()

      const removeRequests = await getDpsRemoveUserRoleRequests()
      expect(removeRequests.length).toBe(1)
      expect(removeRequests[0].url).toEqual('/manage-users-api/prisonusers/ITAG_USER5/roles/ANOTHER_GENERAL_ROLE')

      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Should not be able to assign OAUTH_ADMIN if not an OAuth Admin', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', '')
      await manageUsersApi.stubOAuthAdminDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.checkbox('Oauth Admin')).not.toBeVisible()
      await expect(addRolePage.hintFor('Oauth Admin')).not.toBeVisible()
    })

    test('Should be able to assign OAUTH_ADMIN if an OAuth Admin', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN, AuthRole.OAUTH_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', '')
      await manageUsersApi.stubOAuthAdminDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await expect(addRolePage.checkbox('Oauth Admin')).toBeVisible()
      await expect(addRolePage.hintFor('Oauth Admin')).toHaveText('Some text for oauth admin')
    })

    test('Should cancel adding a role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubNotificationBannerMessage('ROLES', '')
      await manageUsersApi.stubLsaDpsRoles()
      await userPage.addRoleButton.click()

      const addRolePage = await AddRolePage.verifyOnPage(page)
      await addRolePage.cancelButton.click()

      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Should check for CSRF token adding roles', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.selectRoles({ userId: 'ITAG_USER5' }))
    })

    test('Should check for CSRF token removing a role', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(
        page,
        paths.dpsUser.manage.roles.remove({ userId: 'ITAG_USER5', role: 'ANOTHER_GENERAL_ROLE' }),
      )
    })

    test('Should fail attempting to add roles if unauthorised', async ({ page }) => {
      await login(page, { roles: [AuthRole.CREATE_USER] })

      await page.goto(paths.dpsUser.manage.selectRoles({ userId: 'ITAG_USER5' }))
      await AuthErrorPage.verifyOnPage(page)
    })
  })

  test.describe('Managing a user with roles that are restricted to be removed', () => {
    test.describe('As a Local Admin', () => {
      test('Should show request removal link for Central Admin managed role', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          isLocalAdmin: true,
        })
        await expect(userPage.requestRoleRemoval('ANOTHER_GENERAL_ROLE')).toBeVisible()
        await expect(userPage.removeRole('ANOTHER_GENERAL_ROLE')).not.toBeVisible()
      })

      test('Should show request removal link for IMS managed role', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          isLocalAdmin: true,
          dpsRoles: [
            {
              code: 'IMS_USER',
              name: 'IMS User',
              adminRoleOnly: false,
            },
          ],
        })
        await expect(userPage.requestRoleRemoval('IMS_USER')).toBeVisible()
        await expect(userPage.removeRole('IMS_USER')).not.toBeVisible()
      })

      test('Clicking request removal link for Central Admin managed role shows Central Admin removal message', async ({
        page,
      }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          isLocalAdmin: true,
        })
        await userPage.requestRoleRemoval('ANOTHER_GENERAL_ROLE').click()

        const requestRoleRemovalPage = await RequestRoleRemovalPage.verifyOnPage(page)
        await expect(requestRoleRemovalPage.removalMessage).toContainText(
          'This role is centrally managed, please raise a Service Now ticket to get this role removed.',
        )
        await requestRoleRemovalPage.continueButton.click()

        await UserPage.verifyOnPage(page, 'Itag User')
      })

      test('Clicking request removal link for IMS managed role shows IMS removal message', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          isLocalAdmin: true,
          dpsRoles: [
            {
              code: 'IMS_USER',
              name: 'IMS User',
              adminRoleOnly: false,
            },
          ],
        })
        await userPage.requestRoleRemoval('IMS_USER').click()

        const requestRoleRemovalPage = await RequestRoleRemovalPage.verifyOnPage(page)
        await expect(requestRoleRemovalPage.removalMessage).toContainText(
          'If you require a users access to be removed from the Intelligence Management Service (IMS), the Head of Security (Prison roles) or Head of Unit (HQ roles) must contact nisst@justice.gov.uk directly.',
        )
        await requestRoleRemovalPage.continueButton.click()

        await UserPage.verifyOnPage(page, 'Itag User')
      })
    })

    test.describe('As a Central Admin', () => {
      test('Should show request removal link for Central Admin managed role', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
        })
        await expect(userPage.requestRoleRemoval('ANOTHER_GENERAL_ROLE')).not.toBeVisible()
        await expect(userPage.removeRole('ANOTHER_GENERAL_ROLE')).toBeVisible()
      })

      test('Should show request removal link for IMS managed role', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          dpsRoles: [
            {
              code: 'IMS_USER',
              name: 'IMS User',
              adminRoleOnly: false,
            },
          ],
        })
        await expect(userPage.requestRoleRemoval('IMS_USER')).toBeVisible()
        await expect(userPage.removeRole('IMS_USER')).not.toBeVisible()
      })

      test('Clicking request removal link for IMS managed role shows IMS removal message', async ({ page }) => {
        const userPage = await editUser(page, {
          roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
          dpsRoles: [
            {
              code: 'IMS_USER',
              name: 'IMS User',
              adminRoleOnly: false,
            },
          ],
        })
        await userPage.requestRoleRemoval('IMS_USER').click()

        const requestRoleRemovalPage = await RequestRoleRemovalPage.verifyOnPage(page)
        await expect(requestRoleRemovalPage.removalMessage).toContainText(
          'If you require a users access to be removed from the Intelligence Management Service (IMS), the Head of Security (Prison roles) or Head of Unit (HQ roles) must contact nisst@justice.gov.uk directly.',
        )
        await requestRoleRemovalPage.continueButton.click()

        await UserPage.verifyOnPage(page, 'Itag User')
      })
    })
  })

  test.describe('Remove a caseload from a user', () => {
    test('Should remove a caseload from a user', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubDpsRemoveUserCaseload()
      await userPage.removeCaseload('LEI').click()

      const requests = await getDpsRemoveUserCaseloadRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/prisonusers/ITAG_USER5/caseloads/LEI')

      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Active caseload does not have a remove link', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await manageUsersApi.stubDpsRemoveUserCaseload()
      await expect(userPage.removeCaseload('MDI')).not.toBeVisible()
      await expect(userPage.removeCaseload('LEI')).toBeVisible()
    })

    test('Should check for CSRF token', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.removeCaseload({ userId: 'ITAG_USER5', caseload: 'LEI' }))
    })
  })

  test.describe('Add caseloads to a user', () => {
    test('Should not show add caseload button if no role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      })

      await expect(userPage.addCaseloadButton).not.toBeVisible()
    })

    test('Should not show remove caseload link if no role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      })

      await expect(userPage.removeCaseload('LEI')).not.toBeVisible()
    })

    test('Should add a caseload to a user', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
        userCaseloads: {
          username: 'ITAG_USER',
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland',
          },
          caseloads: [
            {
              id: 'MDI',
              name: 'Moorland',
            },
          ],
        },
      })

      await userPage.addCaseloadButton.click()
      const addUserCaseloadPage = await AddUserCaseloadPage.verifyOnPage(page)

      await manageUsersApi.stubDpsAddUserCaseload()
      await addUserCaseloadPage.choose('Leeds (HMP)')
      await addUserCaseloadPage.confirmButton.click()

      const requests = await getDpsAddUserCaseloadRequests()
      expect(requests.length).toBe(1)
      expect(JSON.parse(requests[0].body)).toEqual(['LEI'])

      await UserPage.verifyOnPage(page, 'Itag User')
    })

    test('Should show no caseloads available if none assignable', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await userPage.addCaseloadButton.click()
      const addUserCaseloadPage = await AddUserCaseloadPage.verifyOnPage(page)

      await expect(addUserCaseloadPage.noCaseloads).toHaveText('There are no caseloads available for you to assign.')
    })

    test('Should fail attempting to reach "select-caseloads" if not an admin', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      })

      await expect(userPage.addCaseloadButton).not.toBeVisible()
      await page.goto(paths.dpsUser.manage.selectCaseloads({ userId: 'ITAG_USER5' }))

      await AuthErrorPage.verifyOnPage(page)
    })

    test('Should check for CSRF token', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.selectCaseloads({ userId: 'ITAG_USER5' }))
    })
  })

  test.describe('Activate and deactivate a user', () => {
    test('Should disable a user', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MANAGE_NOMIS_USER_ACCOUNT],
      })

      await expect(userPage.statusTag).toContainText('Active')
      await expect(userPage.activateLink).not.toBeVisible()
      await expect(userPage.deactivateLink).toBeVisible()

      await manageUsersApi.stubDpsUserDisable()
      await manageUsersApi.stubGetDpsUser({ active: false })
      await userPage.deactivateLink.click()

      const requests = await getDpsUserDisableRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/prisonusers/ITAG_USER5/disable-user')

      await expect(userPage.statusTag).toContainText('Inactive')
    })

    test('Should disable an expired user', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MANAGE_NOMIS_USER_ACCOUNT],
        accountStatus: 'EXPIRED',
        active: false,
      })

      await expect(userPage.statusTag).toContainText('EXPIRED ACCOUNT')
      await expect(userPage.activateLink).not.toBeVisible()
      await expect(userPage.deactivateLink).toBeVisible()

      await manageUsersApi.stubDpsUserDisable()
      await manageUsersApi.stubGetDpsUser({ active: false })
      await userPage.deactivateLink.click()

      const requests = await getDpsUserDisableRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/prisonusers/ITAG_USER5/disable-user')

      await expect(userPage.statusTag).toContainText('Inactive')
    })

    test('Should enable an inactive user', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MANAGE_NOMIS_USER_ACCOUNT],
        enabled: false,
        active: false,
      })

      await expect(userPage.statusTag).toContainText('Inactive')
      await expect(userPage.activateLink).toBeVisible()
      await expect(userPage.deactivateLink).not.toBeVisible()

      await manageUsersApi.stubDpsUserEnable()
      await manageUsersApi.stubGetDpsUser({ active: true })
      await userPage.activateLink.click()

      const requests = await getDpsUserEnableRequests()
      expect(requests.length).toBe(1)
      expect(requests[0].url).toEqual('/manage-users-api/prisonusers/ITAG_USER5/enable-user')

      await expect(userPage.statusTag).toContainText('Active')
    })

    test('Should not allow activating a user without the manage nomis user account role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
        enabled: false,
        active: false,
      })

      await expect(userPage.statusTag).toContainText('Inactive')
      await expect(userPage.activateLink).not.toBeVisible()
    })

    test('Should not allow deactivating a user without the manage nomis user account role', async ({ page }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      })

      await expect(userPage.statusTag).toContainText('Active')
      await expect(userPage.deactivateLink).not.toBeVisible()
    })

    test('Should not allow deactivating an expired user without the manage nomis user account role', async ({
      page,
    }) => {
      const userPage = await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
        accountStatus: 'EXPIRED',
        active: false,
      })

      await expect(userPage.statusTag).toContainText('EXPIRED ACCOUNT')
      await expect(userPage.deactivateLink).not.toBeVisible()
    })

    test('Should check for CSRF token when activating a user', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.activate({ userId: 'ITAG_USER5' }))
    })

    test('Should check for CSRF token when deactivating a user', async ({ page }) => {
      await editUser(page, {
        roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      })

      await attemptPostWithoutCsrf(page, paths.dpsUser.manage.deactivate({ userId: 'ITAG_USER5' }))
    })
  })
})
