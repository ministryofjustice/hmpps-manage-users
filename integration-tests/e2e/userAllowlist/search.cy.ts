import moment from 'moment'
import { parse } from 'csv-parse'
import SearchPage from '../../pages/typescript/userAllowlist/searchPage'
import { getEndDate, verifyDataQaText, verifyEmptyFormField, verifyFilterTag } from '../../support/utils'
import { UserAllowlistAddRequest } from '../../../backend/@types/manageUsersApi'
import ViewUserPage from '../../pages/typescript/userAllowlist/viewUserPage'
import paths from '../../../backend/routes/paths'

context('Search allow list users', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
  })

  it('shows a list of users', () => {
    SearchPage.goto({})
    verifyDataQaText('edit-button-AICIAD', 'Anastazia Armistead')
    verifyDataQaText('username-AICIAD', '- AICIAD')
    verifyDataQaText('email-AICIAD', 'anastazia.armistead@justice.gov.uk')
    verifyDataQaText('expiry-AICIAD', `${moment(getEndDate('EXPIRE')).format('DD MMMM YYYY')}`)
    verifyDataQaText('status-AICIAD', 'EXPIRED')
    verifyDataQaText('edit-button-ZAFIRAHT9YH', 'Litany Storm')
    verifyDataQaText('username-ZAFIRAHT9YH', '- ZAFIRAHT9YH')
    verifyDataQaText('email-ZAFIRAHT9YH', 'litany.storm@justice.gov.uk')
    verifyDataQaText('expiry-ZAFIRAHT9YH', `${moment(getEndDate('ONE_MONTH')).format('DD MMMM YYYY')}`)
    verifyDataQaText('status-ZAFIRAHT9YH', 'Active')
  })

  it('clicking on user edit button goes to view user page', () => {
    const expiredUser: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubGetAllowlistUser', expiredUser)
    SearchPage.goto({ expiredUser }).clickEditLink('AICIAD')
    ViewUserPage.create(expiredUser).checkOnPage()
  })

  it('clicking on user view details goes to view user page', () => {
    const expiredUser: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubGetAllowlistUser', expiredUser)
    SearchPage.goto({ expiredUser }).clickViewDetails('AICIAD')
    ViewUserPage.create(expiredUser).checkOnPage()
  })

  it('the download button is available when less than 20000 users in list', () => {
    SearchPage.goto({}).verifyDownloadDisplayed(true)
  })

  it('the download button is available when 20000 users in list', () => {
    SearchPage.goto({ totalElements: 20000 }).verifyDownloadDisplayed(true)
  })

  it('the download button is not available when more than 20000 users in list', () => {
    SearchPage.goto({ totalElements: 20001 }).verifyDownloadDisplayed(false)
  })

  it('the user filter is empty by default', () => {
    SearchPage.goto({})
    verifyEmptyFormField('user')
  })

  it('the status filter is All by default', () => {
    SearchPage.goto({}).verifyStatusFilter('All')
  })

  it('setting active status filter and applying shows active filter tag', () => {
    SearchPage.goto({}).selectStatusFilter('Active').clickApplyFilter()
    verifyFilterTag('Active')
  })

  it('setting expired status filter and applying shows expired filter tag', () => {
    SearchPage.goto({}).selectStatusFilter('Expired').clickApplyFilter()
    verifyFilterTag('EXPIRED')
  })

  it('setting user filter and applying shows user filter tag', () => {
    SearchPage.goto({}).fillUserFilter('Bob').clickApplyFilter()
    verifyFilterTag('Bob')
  })

  it('setting both user filter and status filter and applying shows both filter tags', () => {
    SearchPage.goto({}).fillUserFilter('Bob').selectStatusFilter('Active').clickApplyFilter()
    verifyFilterTag('Bob')
    verifyFilterTag('Active')
  })

  it('downloading the csv has the correct records', () => {
    cy.intercept(`${paths.userAllowList.download({})}?user=&status=ALL&page=0`, (req) => {
      req.redirect(paths.userAllowList.search({}))
    }).as('csvDownload')
    SearchPage.goto({}).clickDownload()
    cy.wait('@csvDownload')
      .its('request')
      .then((req) => {
        cy.request(req).then(({ body, headers }) => {
          expect(headers).to.have.property('content-type', 'text/csv; charset=utf-8')
          parse(body, {}, (err, output) => {
            expect(output, 'number of records').to.have.length(3)
            expect(output[0], 'header row').to.deep.equal([
              'id',
              'username',
              'email',
              'firstName',
              'lastName',
              'reason',
              'createdOn',
              'allowlistEndDate',
              'lastUpdated',
              'lastUpdatedBy',
              'status',
            ])
            expect(output[1], 'first row').to.deep.equal([
              'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
              `AICIAD`,
              `anastazia.armistead@justice.gov.uk`,
              `Anastazia`,
              `Armistead`,
              `For testing`,
              `${new Date('2024-03-19T04:39:08')}`,
              `${getEndDate('EXPIRE')}`,
              `${new Date('2024-03-19T04:39:08')}`,
              'LAQUINAQNW',
              'EXPIRED',
            ])
            expect(output[2], 'first row').to.deep.equal([
              'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
              `ZAFIRAHT9YH`,
              `litany.storm@justice.gov.uk`,
              `Litany`,
              `Storm`,
              `For testing`,
              `${new Date('2024-03-19T04:39:08')}`,
              `${getEndDate('ONE_MONTH')}`,
              `${new Date('2024-03-19T04:39:08')}`,
              'LAQUINAQNW',
              'ACTIVE',
            ])
          })
        })
      })
  })
})
