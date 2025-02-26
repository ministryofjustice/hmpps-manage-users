const MenuPage = require('../pages/menuPage')

context('Menu tiles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Shows Manage User Allow List tile for authorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.manageUserAllowListTile().should('exist')
    menuPage.manageUserAllowListLink().should('contain.text', 'Manage localhost access for users')
    menuPage
      .manageUserAllowListDescription()
      .should('contain.text', 'Manage the expiry of, or add user accounts to the localhost allow list.')
  })

  it('Does not show Manage User Allow List tile for unauthorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()
    MenuPage.verifyOnPage().manageUserAllowListTile().should('not.exist')
  })
})
