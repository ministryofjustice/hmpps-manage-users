import { expect, test } from '@playwright/test'
import * as fs from 'node:fs'
import { getMatchingRequests, resetStubs } from '../../mockApis/wiremock'
import { fillAutocompleteSelect, login } from '../../testUtils'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import AuthRole from '../../../server/interfaces/authRole'
import manageUsersApi from '../../mockApis/manageUsersApi'
import { editUser, gotoSearchPage } from '../../helpers/dpsUser'

const getDpsUserSearchRequests = async () => {
  return getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/manage-users-api/prisonusers/search',
  })
}

test.describe('Search DPS user', () => {
  test.afterEach(async () => {
    await resetStubs()
  })

  test('Should show filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await expect(searchPage.filter).toBeVisible()
  })

  test('Can add and remove user filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await searchPage.userFilterInput.fill('Andy')
    await searchPage.filterButton.click()
    await expect(searchPage.userFilterInput).toHaveValue('Andy')
    await expect(searchPage.filterCategoryLink('Andy')).toBeVisible()
    expect(page.url()).toContain('user=Andy')

    await searchPage.filterCategoryLink('Andy').click()
    await expect(searchPage.filterCategoryLink('Andy')).not.toBeVisible()
    await expect(searchPage.userFilterInput).toHaveValue('')
  })

  test('Can change default ALL status to active or inactive only', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await expect(searchPage.statusAllRadio).toBeChecked()

    await searchPage.statusInactiveRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusInactiveRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('Inactive')).toBeVisible()
    expect(page.url()).toContain('status=INACTIVE')

    await searchPage.statusActiveRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusActiveRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('Active')).toBeVisible()
    expect(page.url()).toContain('status=ACTIVE')

    await searchPage.statusAllRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.statusAllRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('All')).not.toBeVisible()
    expect(page.url()).toContain('status=ALL')
  })

  test('Can add and remove show LSA only filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()
    await expect(searchPage.showLsaOnlyCheckbox).toBeChecked()
    await expect(searchPage.filterCategoryLink('Only')).toBeVisible()
    expect(page.url()).toContain('showOnlyLSAs=true')

    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()
    await expect(searchPage.showLsaOnlyCheckbox).not.toBeChecked()
    await expect(searchPage.filterCategoryLink('Only')).not.toBeVisible()
  })

  test('Can add and remove a single caseload filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await fillAutocompleteSelect(searchPage.caseload, 'Moorland')
    await searchPage.filterButton.click()
    await expect(searchPage.filterCategoryLink('Moorland')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Active caseload only')).toBeVisible()
    await expect(searchPage.activeCaseloadOnlyYesRadio).toBeChecked()
    expect(page.url()).toContain('groupCode=MDI')
    expect(page.url()).toContain('restrictToActiveGroup=true')

    await searchPage.filterCategoryLink('Active caseload only').click()
    await expect(searchPage.filterCategoryLink('Active caseload only')).not.toBeVisible()
    await expect(searchPage.activeCaseloadOnlyYesRadio).not.toBeChecked()
    await expect(searchPage.activeCaseloadOnlyNoRadio).toBeChecked()

    await searchPage.filterCategoryLink('Moorland').click()
    await expect(searchPage.filterCategoryLink('Moorland')).not.toBeVisible()
    await expect(searchPage.activeCaseloadOnlyYesRadio).toBeChecked()
  })

  test('Can not see caseload filter when not an admin', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })
    await expect(searchPage.caseload).not.toBeVisible()
  })

  test('Can add and remove a single role filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.checkbox('User Admin').click()
    await searchPage.filterButton.click()
    await expect(searchPage.filterCategoryLink('User Admin')).toBeVisible()
    expect(page.url()).toContain('roleCode=USER_ADMIN')

    await searchPage.filterCategoryLink('User Admin').click()
    await expect(searchPage.filterCategoryLink('User Admin')).not.toBeVisible()
  })

  test('Can add multiple role filters', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.checkbox('User Admin').click()
    await searchPage.checkbox('Maintain Roles').click()
    await searchPage.filterButton.click()
    await expect(searchPage.filterCategoryLink('User Admin')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Maintain Roles')).toBeVisible()
    expect(page.url()).toContain('roleCode=USER_ADMIN')
    expect(page.url()).toContain('roleCode=MAINTAIN_ACCESS_ROLES')
  })

  test('Can change default All selected roles to Any selected roles', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })
    await expect(searchPage.rolesAllMatchRadio).toBeChecked()

    await searchPage.rolesAnyMatchRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.rolesAnyMatchRadio).toBeChecked()
    await expect(searchPage.filterCategoryLink('Any')).toBeVisible()
    expect(page.url()).toContain('inclusiveRoles=true')

    await searchPage.rolesAllMatchRadio.click()
    await searchPage.filterButton.click()
    await expect(searchPage.rolesAllMatchRadio).toBeChecked()
    expect(page.url()).toContain('inclusiveRoles=false')
  })

  test('Can search for a role to filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    const userAdminCheckbox = searchPage.checkbox('User Admin')
    const oauthAdminCheckbox = searchPage.checkbox('Oauth Admin')
    const maintainRolesCheckbox = searchPage.checkbox('Maintain Roles')
    await expect(userAdminCheckbox).toBeVisible()
    await expect(oauthAdminCheckbox).toBeVisible()
    await expect(maintainRolesCheckbox).toBeVisible()

    await searchPage.searchRole('User')
    await expect(userAdminCheckbox).toBeVisible()
    await expect(oauthAdminCheckbox).not.toBeVisible()
    await expect(maintainRolesCheckbox).not.toBeVisible()

    await searchPage.searchRole('maInTaIn')
    await expect(userAdminCheckbox).not.toBeVisible()
    await expect(oauthAdminCheckbox).not.toBeVisible()
    await expect(maintainRolesCheckbox).toBeVisible()

    await searchPage.searchRole('admin')
    await expect(userAdminCheckbox).toBeVisible()
    await expect(oauthAdminCheckbox).toBeVisible()
    await expect(maintainRolesCheckbox).not.toBeVisible()

    await searchPage.searchRole('')
    await expect(userAdminCheckbox).toBeVisible()
    await expect(oauthAdminCheckbox).toBeVisible()
    await expect(maintainRolesCheckbox).toBeVisible()
  })

  test('Adding and removing roles updates roles selected counter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await expect(searchPage.rolesSelectedCounter).toHaveText('')

    const userAdminCheckbox = searchPage.checkbox('User Admin')
    await userAdminCheckbox.click()
    await expect(searchPage.rolesSelectedCounter).toHaveText('1 selected')

    await searchPage.checkbox('Maintain Roles').click()
    await expect(searchPage.rolesSelectedCounter).toHaveText('2 selected')

    await userAdminCheckbox.click()
    await expect(searchPage.rolesSelectedCounter).toHaveText('1 selected')
  })

  test('Roles selected counter shows number of roles selected after applying filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.checkbox('Maintain Roles').click()
    await searchPage.checkbox('User Admin').click()
    await expect(searchPage.rolesSelectedCounter).toHaveText('2 selected')

    await searchPage.filterButton.click()
    await expect(searchPage.rolesSelectedCounter).toHaveText('2 selected')
  })

  test('Shows user details in the results', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      totalElements: 3,
    })

    await expect(searchPage.userTableCells).toHaveCount(3)
    const firstCell = searchPage.userTableCells.nth(0)
    await expect(firstCell).toContainText('Itag\u00a0User0')
    await expect(firstCell).toContainText('ITAG_USER0@gov.uk')
    await expect(firstCell).toContainText('Active')
    await expect(firstCell).toContainText('Brixton (HMP)')
    await expect(firstCell).toContainText('No DPS roles')
    await expect(searchPage.userTableCells.nth(1)).toContainText('1 DPS role')
    await expect(searchPage.userTableCells.nth(2)).toContainText('2 DPS roles')
  })

  test('Clicking user details link goes to user details page', async ({ page }) => {
    const userPage = await editUser(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
    })
    await expect(userPage.header).toHaveText('Itag User')
  })

  test('Can click through pages while maintaining filter', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      totalElements: 101,
      size: 20,
    })

    await searchPage.filterAll()

    await expect(searchPage.userTableCells).toHaveCount(20)
    await expect(searchPage.paginationResults).toContainText('Showing 1 to 20 of 101 total results')
    await searchPage.paginationPageLink(5).click()
    await expect(searchPage.filterCategoryLink('Andy')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Active', true)).toBeVisible()
    await expect(searchPage.filterCategoryLink('Moorland')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Active caseload only')).toBeVisible()
    await expect(searchPage.filterCategoryLink('User Admin')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Any')).toBeVisible()
    await expect(searchPage.filterCategoryLink('Only', true)).toBeVisible()
  })

  test('Calls the dps user search api for admin with no filter', async ({ page }) => {
    await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    const requests = await getDpsUserSearchRequests()
    expect(requests.length).toBe(1)
    expect(requests[0].queryParams).toEqual({
      status: { key: 'status', values: ['ALL'] },
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
    })
  })

  test('Calls the dps user search api for admin with filter applied', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.filterAll()

    const requests = await getDpsUserSearchRequests()
    // expecting two requests, once for the page view and once after applying filter
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      nameFilter: { key: 'nameFilter', values: ['Andy'] },
      accessRoles: { key: 'accessRoles', values: ['USER_ADMIN'] },
      status: { key: 'status', values: ['ACTIVE'] },
      caseload: { key: 'caseload', values: ['MDI'] },
      activeCaseload: { key: 'activeCaseload', values: ['MDI'] },
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
      inclusiveRoles: { key: 'inclusiveRoles', values: ['true'] },
      showOnlyLSAs: { key: 'showOnlyLSAs', values: ['true'] },
    })
  })

  test('Calls the dps user search api for non-admin with no filter', async ({ page }) => {
    await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    const requests = await getDpsUserSearchRequests()
    expect(requests.length).toBe(1)
    expect(requests[0].queryParams).toEqual({
      status: { key: 'status', values: ['ALL'] },
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
    })
  })

  test('Calls the dps user search api for non-admin with filter applied', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    await searchPage.filterAll(false)

    const requests = await getDpsUserSearchRequests()
    // expecting two requests, once for the page view and once after applying filter
    expect(requests.length).toBe(2)
    expect(requests[1].queryParams).toEqual({
      nameFilter: { key: 'nameFilter', values: ['Andy'] },
      accessRoles: { key: 'accessRoles', values: ['USER_ADMIN'] },
      status: { key: 'status', values: ['ACTIVE'] },
      size: { key: 'size', values: ['20'] },
      page: { key: 'page', values: ['0'] },
      inclusiveRoles: { key: 'inclusiveRoles', values: ['true'] },
      showOnlyLSAs: { key: 'showOnlyLSAs', values: ['true'] },
    })
  })

  test('Can download the list of users', async ({ page }) => {
    await manageUsersApi.stubDpsUsersDownload()
    const downloadPromise = page.waitForEvent('download')
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.downloadButton.click()
    const path = await downloadPromise.then(dl => dl.path())
    const csvLines = fs.readFileSync(path, 'utf-8').split('\n')
    expect(csvLines.length).toBe(3)
    expect(csvLines[0]).toEqual(
      '"staffId","username","firstName","lastName","activeCaseLoadId","accountStatus","lockedFlag","expiredFlag","active","email","dpsRoleCount"',
    )
    expect(csvLines[1]).toEqual('7,"LOCKED_USER","User","Locked",,"LOCKED",true,false,false,,0')
    expect(csvLines[2]).toEqual(
      '1,"ITAG_USER","Itag","User","MDI","OPEN",false,false,true,"multiple.user.test@digital.justice.gov.uk",0',
    )
  })

  test('Can download the list of LSA admins', async ({ page }) => {
    await manageUsersApi.stubDpsLsaDownload()
    const downloadPromise = page.waitForEvent('download')
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN] })

    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()
    await searchPage.downloadLsaButton.click()

    const path = await downloadPromise.then(dl => dl.path())
    const csvLines = fs.readFileSync(path, 'utf-8').split('\n')
    expect(csvLines.length).toBe(3)
    expect(csvLines[0]).toEqual(
      '"staffId","username","firstName","lastName","activeCaseLoadId","email","dpsRoleCount","lsaCaseloadId","lsaCaseload"',
    )
    expect(csvLines[1]).toEqual('1,"ITAG_USER","Itag","User","MDI","multiple.user.test@digital.justice.gov.uk",0,,')
    expect(csvLines[2]).toEqual('2,"ITAG_USER2","Itag2","User","MDI","multiple.user.test2@digital.justice.gov.uk",0,,')
  })

  test('Hides the download user button and displays message if result set too large', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      totalElements: 20001,
    })

    await expect(searchPage.downloadButton).not.toBeVisible()
    await expect(searchPage.downloadLimitExceededMessage).toHaveText(
      'More than 20000 results returned, please refine your search if you want to download the results',
    )
  })

  test('Hides the download lsa button and displays message if result set too large', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN],
      totalElements: 20001,
    })

    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()

    await expect(searchPage.downloadLsaButton).not.toBeVisible()
    await expect(searchPage.downloadLimitLsaExceededMessage).toHaveText(
      'More than 20000 results returned, please refine your search if you want to download the LSA report',
    )
  })

  test('Does not show the download users button for non-admin', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    await expect(searchPage.downloadButton).not.toBeVisible()
  })

  test('Does not show download limit exceeds message if result set too large and non-admin', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      totalElements: 20001,
    })

    await expect(searchPage.downloadLimitExceededMessage).not.toBeVisible()
  })

  test('Does not show the download lsa button for non-admin', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, { roles: [AuthRole.MAINTAIN_ACCESS_ROLES] })

    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()

    await expect(searchPage.downloadLsaButton).not.toBeVisible()
  })

  test('Does not show download lsa limit exceeds message if result set too large and non-admin', async ({ page }) => {
    const searchPage = await gotoSearchPage(page, {
      roles: [AuthRole.MAINTAIN_ACCESS_ROLES],
      totalElements: 20001,
    })

    await searchPage.showLsaOnlyCheckbox.click()
    await searchPage.filterButton.click()

    await expect(searchPage.downloadLimitLsaExceededMessage).not.toBeVisible()
  })

  test('Should fail attempting to search dps user if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_ACCESS_ROLES'] })

    await page.goto(paths.dpsUser.search.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to search dps user if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.dpsUser.search.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
