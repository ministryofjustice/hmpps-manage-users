import { expect, test } from '@playwright/test'

import { login, resetStubs } from '../../testUtils'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import CreateEmailDomainPage from '../../pages/emailDomains/createEmailDomainPage'
import DeleteEmailDomainPage from '../../pages/emailDomains/deleteEmailDomainPage'
import gotoEmailDomainList from '../../helpers/emailDomains'

test.describe('Manage Email Domains', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubGetAllEmailDomains()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows list of email domains with details and Delete link for each', async ({ page }) => {
    const emailDomainsPage = await gotoEmailDomainList(page)

    await expect(emailDomainsPage.tableRows).toHaveCount(4)
    await expect(emailDomainsPage.tableRows.nth(0)).toHaveText('Domain Description Actions') // Header
    await expect(emailDomainsPage.tableRows.nth(1)).toHaveText(
      'test.justice.gov.uk Test justice domain Delete domain test.justice.gov.uk',
    )
    await expect(emailDomainsPage.tableRows.nth(2)).toHaveText(
      'test.police.uk Test police domain Delete domain test.police.uk',
    )
    await expect(emailDomainsPage.tableRows.nth(3)).toHaveText(
      'test.external.com Test external domain Delete domain test.external.com',
    )
  })

  test('Shows no domains message when there are no registered domains', async ({ page }) => {
    await manageUsersApi.stubGetAllEmailDomains([])
    const emailDomainsPage = await gotoEmailDomainList(page)

    await expect(emailDomainsPage.tableRows).not.toBeVisible()
    await expect(emailDomainsPage.noDomainsMessage).toHaveText(
      'There are no registered email domains. Add an email domain using the button above.',
    )
  })

  test('Goes to add email domain page when clicking add email domain button', async ({ page }) => {
    const emailDomainsPage = await gotoEmailDomainList(page)

    await emailDomainsPage.addEmailDomainButton.click()
    await CreateEmailDomainPage.verifyOnPage(page)
  })

  test('Goes to delete confirmation page when clicking delete link', async ({ page }) => {
    const emailDomainsPage = await gotoEmailDomainList(page)

    await manageUsersApi.stubGetEmailDomain('cb5d9f0c-b7c8-40d5-8626-2e97f66d5127')
    await emailDomainsPage.clickDeleteLink('test.justice.gov.uk')
    await DeleteEmailDomainPage.verifyOnPage(page)
  })

  test('Should fail attempting to list email domains if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.emailDomains.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to list email domains if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.emailDomains.list.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })
})
