import moment from 'moment'
import { UserAllowlistAddRequest } from '../../../backend/@types/manageUsersApi'
import ViewUserPage from '../../pages/typescript/userAllowlist/viewUserPage'
import { getEndDate, verifyDataQaText } from '../../support/utils'
import EditUserPage from '../../pages/typescript/userAllowlist/editUserPage'
import SearchPage from '../../pages/typescript/userAllowlist/searchPage'
import Page from '../../pages/typescript/page'

context('View allow list user', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
  })

  it('Shows details of active user', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'THREE_MONTHS',
    }
    ViewUserPage.goto(user)
    verifyDataQaText('status-tag', 'Active')
    verifyDataQaText('expiry', `${moment(getEndDate('THREE_MONTHS')).format('D MMMM YYYY')}`)
    verifyDataQaText('created-date', '19 March 2024')
    verifyDataQaText('last-updated-date', '19 March 2024')
    verifyDataQaText('last-updated-by', 'LAQUINAQNW')
  })

  it('Shows details of unrestricted active user', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'NO_RESTRICTION',
    }
    ViewUserPage.goto(user)
    verifyDataQaText('status-tag', 'Active')
    verifyDataQaText('expiry', `No restriction`)
    verifyDataQaText('created-date', '19 March 2024')
    verifyDataQaText('last-updated-date', '19 March 2024')
    verifyDataQaText('last-updated-by', 'LAQUINAQNW')
  })

  it('Shows details of expired user', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    ViewUserPage.goto(user)
    verifyDataQaText('status-tag', 'EXPIRED')
    verifyDataQaText('expiry', `${moment(getEndDate('EXPIRE')).format('D MMMM YYYY')}`)
    verifyDataQaText('created-date', '19 March 2024')
    verifyDataQaText('last-updated-date', '19 March 2024')
    verifyDataQaText('last-updated-by', 'LAQUINAQNW')
  })

  it('Clicking the edit link goes to the edit page for that user', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    ViewUserPage.goto(user).clickEdit()
    EditUserPage.create(user).checkOnPage()
  })

  it('Clicking the search link goes to the search page', () => {
    cy.task('stubSearchAllowlistUser')
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    ViewUserPage.goto(user).clickSearch()
    Page.verifyOnPage(SearchPage)
  })
})
