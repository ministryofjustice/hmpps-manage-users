import { Page } from '@playwright/test'
import { login } from '../testUtils'
import AuthRole from '../../server/interfaces/authRole'
import HomePage from '../pages/homePage'
import EmailDomainListPage from '../pages/emailDomains/emailDomainListPage'

const gotoEmailDomainList = async (page: Page) => {
  await login(page, { roles: [AuthRole.MAINTAIN_EMAIL_DOMAINS] })

  const homePage = await HomePage.verifyOnPage(page)
  await homePage.selectTile('view_email_domains_link')
  return EmailDomainListPage.verifyOnPage(page)
}
export default gotoEmailDomainList
