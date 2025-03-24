import { UserAllowlistAddRequest } from '../../../backend/@types/manageUsersApi'
import { verifyDataQaText, verifyFormError } from '../../support/utils'
import EditUserPage from '../../pages/typescript/userAllowlist/editUserPage'
import ViewUserPage from '../../pages/typescript/userAllowlist/viewUserPage'

context('Edit allow list user', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
  })

  it('Access period is set to one month by default', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'THREE_MONTHS',
    }
    EditUserPage.goto(user).verifyAccessPeriod('One month')
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
    EditUserPage.goto(user)
    verifyDataQaText('status-tag', 'Active')
    verifyDataQaText('username', 'AICIAD')
    verifyDataQaText('email', 'anastazia.armistead@justice.gov.uk')
    verifyDataQaText('firstName', 'Anastazia')
    verifyDataQaText('lastName', 'Armistead')
    verifyDataQaText('reason', 'For testing')
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
    EditUserPage.goto(user)
    verifyDataQaText('status-tag', 'EXPIRED')
    verifyDataQaText('username', 'AICIAD')
    verifyDataQaText('email', 'anastazia.armistead@justice.gov.uk')
    verifyDataQaText('firstName', 'Anastazia')
    verifyDataQaText('lastName', 'Armistead')
    verifyDataQaText('reason', 'For testing')
  })

  it('Submit is successful if reason is filled in, and goes to view page for that user', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubUpdateAllowlistUser')
    const form = {
      reason: 'Needed for extra support in HAAR team.',
    }
    EditUserPage.goto(user).fillForm(form).submit()
    ViewUserPage.create(user).checkOnPage()
  })

  it('Submit is unsuccessful if reason is not filled in, and shows error for reason', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubUpdateAllowlistUser')
    const form = {}
    const editUserPage = EditUserPage.goto(user)
    editUserPage.fillForm(form).submit()
    editUserPage.checkOnPage()
    verifyFormError('reason')
  })

  it('Submit is unsuccessful if reason is not filled in, but retains chosen access period', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubUpdateAllowlistUser')
    const form = {}
    const editUserPage = EditUserPage.goto(user)
    editUserPage.selectAccessPeriod('Twelve months').fillForm(form).submit()
    editUserPage.checkOnPage()
    editUserPage.verifyAccessPeriod('Twelve months')
  })

  it('Cancelling goes back to the user view page', () => {
    const user: UserAllowlistAddRequest = {
      username: 'AICIAD',
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      accessPeriod: 'EXPIRE',
    }
    cy.task('stubUpdateAllowlistUser')
    const form = {
      reason: 'Needed for extra support in HAAR team.',
    }
    const editUserPage = EditUserPage.goto(user)
    editUserPage.selectAccessPeriod('Twelve months').fillForm(form).cancel()
    ViewUserPage.create(user).checkOnPage()
  })
})
