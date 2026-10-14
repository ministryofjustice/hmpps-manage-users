import { expect, Page, test } from '@playwright/test'

import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import EmailDomainListPage from '../../pages/emailDomains/emailDomainListPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import DeleteEmailDomainPage from '../../pages/emailDomains/deleteEmailDomainPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import gotoEmailDomainList from '../../helpers/emailDomains'

const gotoDeleteEmailDomain = async (page: Page) => {
  const emailDomainsPage = await gotoEmailDomainList(page)
  await emailDomainsPage.clickDeleteLink('test.justice.gov.uk')
  return DeleteEmailDomainPage.verifyOnPage(page)
}

const getDeleteEmailDomainRequests = async () => {
  return getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/manage-users-api/email-domains/.*',
  })
}

test.describe('Delete Email Domain', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubGetAllEmailDomains()
    await manageUsersApi.stubGetEmailDomain('cb5d9f0c-b7c8-40d5-8626-2e97f66d5127')
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows an error if the confirmed domain to delete is empty', async ({ page }) => {
    const deleteEmailDomainPage = await gotoDeleteEmailDomain(page)

    await deleteEmailDomainPage.deleteEmailDomainButton.click()

    await expect(deleteEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Enter "test.justice.gov.uk" to confirm deletion of domain',
    )
  })

  test('Shows an error if the confirmed domain is different to the expected domain', async ({ page }) => {
    const deleteEmailDomainPage = await gotoDeleteEmailDomain(page)

    await deleteEmailDomainPage.confirmDomainTextbox.fill('not.test.justice.gov.uk')
    await deleteEmailDomainPage.deleteEmailDomainButton.click()

    await expect(deleteEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Enter "test.justice.gov.uk" to confirm deletion of domain',
    )
  })

  test('Deletes an email domain when filling in the expected domain and clicking delete email domain button', async ({
    page,
  }) => {
    const deleteEmailDomainPage = await gotoDeleteEmailDomain(page)

    await manageUsersApi.stubDeleteEmailDomain('cb5d9f0c-b7c8-40d5-8626-2e97f66d5127')
    await deleteEmailDomainPage.confirmDomainTextbox.fill('test.justice.gov.uk')
    await deleteEmailDomainPage.deleteEmailDomainButton.click()

    const requests = await getDeleteEmailDomainRequests()
    expect(requests.length).toBe(1)
    expect(requests[0].url).toEqual('/manage-users-api/email-domains/cb5d9f0c-b7c8-40d5-8626-2e97f66d5127')

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Goes to email domain list page if deleting an email domain is cancelled', async ({ page }) => {
    const deleteEmailDomainPage = await gotoDeleteEmailDomain(page)

    await deleteEmailDomainPage.cancelButton.click()

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Should go to email domain list page if manually going to the delete email domain url with an id that is not a uuid', async ({
    page,
  }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

    await manageUsersApi.stubGetEmailDomainBadRequest('not-a-valid-uuid')
    await page.goto(paths.emailDomains.deleteWithId({ id: 'not-a-valid-uuid' }))

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Should go to email domain list page if manually going to the delete email domain url with a uuid that does not exist', async ({
    page,
  }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

    await manageUsersApi.stubGetEmailDomainNotFound('872c0de0-0a23-4f56-be4a-c3993690fe45')
    await page.goto(paths.emailDomains.deleteWithId({ id: '872c0de0-0a23-4f56-be4a-c3993690fe45' }))

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Should fail attempting to delete email domain if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.emailDomains.deleteWithId({ id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127' }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to delete email domain if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.emailDomains.deleteWithId({ id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127' }))
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

    await attemptPostWithoutCsrf(page, paths.emailDomains.deleteWithId({ id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127' }))
  })
})
