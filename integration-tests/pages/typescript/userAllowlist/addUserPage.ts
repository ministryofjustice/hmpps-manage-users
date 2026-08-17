import Page from '../page'
import { getFormField, getRadio, isChecked, typeOrClear } from '../../../support/utils'

type AllowListUserType = 'GENERAL' | 'DIGITAL'

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

  public static goto(userType?: AllowListUserType): AddUserPage {
    const query = userType ? `?userType=${userType}` : ''
    cy.visit(`/user-allow-list/add${query}`)
    return Page.verifyOnPage(AddUserPage)
  }

  selectUserType = (label: 'General user' | 'Digital user'): AddUserPage => {
    getRadio(label).click()
    return this
  }

  continue = () => {
    cy.get('[data-qa=continue-button]').click()
    return this
  }

  cancelUserType = () => cy.get('[data-qa=cancel-userType-button]').click()

  verifyAccessPeriod = (label: string): AddUserPage => {
    isChecked(getRadio(label))
    return this
  }

  selectAccessPeriod = (label: string): AddUserPage => {
    getRadio(label).click()
    return this
  }

  fillForm = (optionalForm: OptionalForm, fillReason: boolean = true): AddUserPage => {
    typeOrClear(getFormField('username'), optionalForm.username)
    typeOrClear(getFormField('email'), optionalForm.email)
    typeOrClear(getFormField('firstName'), optionalForm.firstName)
    typeOrClear(getFormField('lastName'), optionalForm.lastName)
    if (fillReason) {
      typeOrClear(getFormField('reason'), optionalForm.reason)
    }
    return this
  }

  submit = () => cy.get('[data-qa=submit-button]').click()

  cancel = () => cy.get('[data-qa=cancel-button]').click()
}
