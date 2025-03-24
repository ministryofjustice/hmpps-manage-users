import Page from '../page'
import { UserAllowlistAddRequest } from '../../../../backend/@types/manageUsersApi'

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
}
