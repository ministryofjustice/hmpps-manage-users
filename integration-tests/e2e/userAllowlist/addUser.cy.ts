import AddUserPage from '../../pages/typescript/userAllowlist/addUserPage'
import Page from '../../pages/typescript/page'
import SearchPage from '../../pages/typescript/userAllowlist/searchPage'
import { verifyFormError, verifyFormValue } from '../../support/utils'
import MenuPage from '../../pages/typescript/menuPage'

context('Add allow list user', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
  })

  it('access period is set to one month by default', () => {
    AddUserPage.goto().verifyAccessPeriod('One month')
  })

  it('submit is successful if all fields are filled in', () => {
    cy.task('stubAddAllowlistUser')
    cy.task('stubSearchAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'jameisha_mullings2s@employee.zg',
      firstName: 'Derryck',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(SearchPage)
  })

  it('submit shows error for username if missing', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      email: 'jameisha_mullings2s@employee.zg',
      firstName: 'Derryck',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('username')
  })

  it('submit shows error for email if missing', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      firstName: 'Derryck',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('email')
  })

  it('submit shows error for email if not in email format', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'not an email',
      firstName: 'Derryck',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('email')
  })

  it('submit shows error for firstName if missing', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'jameisha_mullings2s@employee.zg',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('firstName')
  })

  it('submit shows error for lastName if missing', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'jameisha_mullings2s@employee.zg',
      firstName: 'Derryck',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('lastName')
  })

  it('submit shows error for reason if missing', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'jameisha_mullings2s@employee.zg',
      firstName: 'Derryck',
      lastName: 'Siegle',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormError('reason')
  })

  it('submit retains username if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormValue('username', 'fasha6v')
  })

  it('submit retains email if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      email: 'jameisha_mullings2s@employee.zg',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormValue('email', 'jameisha_mullings2s@employee.zg')
  })

  it('submit retains firstName if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      firstName: 'Derryck',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormValue('firstName', 'Derryck')
  })

  it('submit retains lastName if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      lastName: 'Siegle',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormValue('lastName', 'Siegle')
  })

  it('submit retains reason if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).submit()
    Page.verifyOnPage(AddUserPage)
    verifyFormValue('reason', 'for test purposes')
  })

  it('submit retains access period if errors elsewhere', () => {
    cy.task('stubAddAllowlistUser')
    const form = {}
    AddUserPage.goto().selectAccessPeriod('Six months').fillForm(form).submit()
    Page.verifyOnPage(AddUserPage).verifyAccessPeriod('Six months')
  })

  it('cancelling returns back to the menu page', () => {
    cy.task('stubAddAllowlistUser')
    const form = {
      username: 'fasha6v',
      email: 'not an email',
      firstName: 'Derryck',
      lastName: 'Siegle',
      reason: 'for test purposes',
    }
    AddUserPage.goto().fillForm(form).cancel()
    Page.verifyOnPage(MenuPage)
  })
})
