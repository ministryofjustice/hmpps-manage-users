import Page from '../page'
import { UserAllowlistAddRequest } from '../../../../backend/@types/manageUsersApi'

export default class ViewUserPage extends Page {
  constructor(firstName: string, lastName: string) {
    super(`${firstName} ${lastName}`)
  }

  public static goto(user: UserAllowlistAddRequest): ViewUserPage {
    cy.task('stubGetAllowlistUser', user)
    cy.visit(`/user-allow-list/${user.username}/view`)
    const viewUserPage = ViewUserPage.create(user)
    viewUserPage.checkOnPage()
    return viewUserPage
  }

  public static create = (user: UserAllowlistAddRequest) => {
    return new ViewUserPage(user.firstName, user.lastName)
  }

  clickEdit = () => cy.get('[data-qa=edit-link]').click()

  clickSearch = () => cy.get('[data-qa=search-link]').click()
}
