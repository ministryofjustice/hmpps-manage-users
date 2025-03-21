import Page from '../page'
import { getFormField, getRadio, isChecked, typeOrClear } from '../../../support/utils'

interface OptionalForm {
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  reason?: string
}

export default class AddUserPage extends Page {
  constructor() {
    super('Add user to allow list')
  }

  public static goto(): AddUserPage {
    cy.visit('/user-allow-list/add')
    return Page.verifyOnPage(AddUserPage)
  }

  verifyAccessPeriod = (label: string): AddUserPage => {
    isChecked(getRadio(label))
    return this
  }

  selectAccessPeriod = (label: string): AddUserPage => {
    getRadio(label).click()
    return this
  }

  fillForm = (optionalForm: OptionalForm): AddUserPage => {
    typeOrClear(getFormField('username'), optionalForm.username)
    typeOrClear(getFormField('email'), optionalForm.email)
    typeOrClear(getFormField('firstName'), optionalForm.firstName)
    typeOrClear(getFormField('lastName'), optionalForm.lastName)
    typeOrClear(getFormField('reason'), optionalForm.reason)
    return this
  }

  submit = () => cy.get('[data-qa=submit-button]').click()

  cancel = () => cy.get('[data-qa=cancel-button]').click()
}
