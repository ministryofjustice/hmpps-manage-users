import Page from '../page'
import { UserAllowlistAddRequest } from '../../../../backend/@types/manageUsersApi'
import { getFormField, getRadio, isChecked, typeOrClear } from '../../../support/utils'

interface OptionalForm {
  reason?: string
}

export default class EditUserPage extends Page {
  constructor(firstName: string, lastName: string) {
    super(`Editing user allow list access for ${firstName} ${lastName}`)
  }

  public static goto(user: UserAllowlistAddRequest): EditUserPage {
    cy.task('stubGetAllowlistUser', user)
    cy.visit(`/user-allow-list/${user.username}/edit`)
    const editUserPage = EditUserPage.create(user)
    editUserPage.checkOnPage()
    return editUserPage
  }

  public static create = (user: UserAllowlistAddRequest) => {
    return new EditUserPage(user.firstName, user.lastName)
  }

  verifyAccessPeriod = (label: string): EditUserPage => {
    isChecked(getRadio(label))
    return this
  }

  selectAccessPeriod = (label: string): EditUserPage => {
    getRadio(label).click()
    return this
  }

  fillForm = (optionalForm: OptionalForm): EditUserPage => {
    typeOrClear(getFormField('reason'), optionalForm.reason)
    return this
  }

  submit = () => cy.get('[data-qa=submit-button]').click()

  cancel = () => cy.get('[data-qa=cancel-button]').click()
}
