import { expect, Page, test } from '@playwright/test'

import { attemptPostWithoutCsrf, login, resetStubs } from '../../testUtils'
import EmailDomainListPage from '../../pages/emailDomains/emailDomainListPage'
import manageUsersApi from '../../mockApis/manageUsersApi'
import AuthRole from '../../../server/interfaces/authRole'
import paths from '../../../server/routes/paths'
import AuthErrorPage from '../../pages/authErrorPage'
import CreateEmailDomainPage from '../../pages/emailDomains/createEmailDomainPage'
import { getMatchingRequests } from '../../mockApis/wiremock'
import gotoEmailDomainList from '../../helpers/emailDomains'

const gotoCreateEmailDomain = async (page: Page) => {
  const emailDomainsPage = await gotoEmailDomainList(page)
  await emailDomainsPage.addEmailDomainButton.click()
  return CreateEmailDomainPage.verifyOnPage(page)
}

const getCreateEmailDomainRequests = async () => {
  return getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/manage-users-api/email-domains',
  })
}

test.describe('Create Email Domain', () => {
  test.beforeEach(async () => {
    await manageUsersApi.stubGetAllEmailDomains()
  })

  test.afterEach(async () => {
    await resetStubs()
  })

  test('Shows an error if domain name is blank', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainDescriptionTextbox.fill('Test description')
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText('There is a problem Enter a domain name')
  })

  test('Shows an error if domain name is less than 6 characters', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainNameTextbox.fill('x.com')
    await createEmailDomainPage.domainDescriptionTextbox.fill('Test description')
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Domain name must be 6 characters or more',
    )
  })

  test('Shows an error if domain name is more than 100 characters', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainNameTextbox.fill(`${'x'.repeat(97)}.com`)
    await createEmailDomainPage.domainDescriptionTextbox.fill('Test description')
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Domain name must be 100 characters or less',
    )
  })

  test('Shows an error if domain description is blank', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainNameTextbox.fill('justice.gov.uk')
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText('There is a problem Enter a domain description')
  })

  test('Shows an error if domain description is less than 2 characters', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainNameTextbox.fill('justice.gov.uk')
    await createEmailDomainPage.domainDescriptionTextbox.fill('D')
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Domain description must be 2 characters or more',
    )
  })

  test('Shows an error if domain description is more than 200 characters', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await createEmailDomainPage.domainNameTextbox.fill('justice.gov.uk')
    await createEmailDomainPage.domainDescriptionTextbox.fill(`${'x'.repeat(201)}`)
    await createEmailDomainPage.addEmailDomainButton.click()
    await expect(createEmailDomainPage.errorSummary).toHaveText(
      'There is a problem Domain description must be 200 characters or less',
    )
  })

  test('Creates an email domain if valid name and description entered', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await manageUsersApi.stubCreateEmailDomain()
    await createEmailDomainPage.domainNameTextbox.fill('justice.gov.uk')
    await createEmailDomainPage.domainDescriptionTextbox.fill('Test description')
    await createEmailDomainPage.addEmailDomainButton.click()

    const requests = await getCreateEmailDomainRequests()
    expect(requests.length).toBe(1)
    expect(JSON.parse(requests[0].body)).toEqual({ description: 'Test description', name: 'justice.gov.uk' })

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Goes to email domain list page if creating an email domain is cancelled', async ({ page }) => {
    const createEmailDomainPage = await gotoCreateEmailDomain(page)

    await manageUsersApi.stubCreateEmailDomain()
    await createEmailDomainPage.domainNameTextbox.fill('justice.gov.uk')
    await createEmailDomainPage.domainDescriptionTextbox.fill('Test description')
    await createEmailDomainPage.cancelButton.click()

    await EmailDomainListPage.verifyOnPage(page)
  })

  test('Should fail attempting to create email domains if unauthorised', async ({ page }) => {
    await login(page, { roles: ['ROLE_NOT_MAINTAIN_EMAIL_DOMAINS'] })

    await page.goto(paths.emailDomains.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should fail attempting to create email domains if has other manage users role', async ({ page }) => {
    await login(page, { roles: [AuthRole.CREATE_USER] })

    await page.goto(paths.emailDomains.create.pattern)
    await AuthErrorPage.verifyOnPage(page)
  })

  test('Should check for CSRF token', async ({ page }) => {
    await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

    await attemptPostWithoutCsrf(page, paths.emailDomains.create.pattern)
  })
})
