const MenuPage = require('../pages/menuPage')

context('Menu tiles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Shows Search User Allow List tile for authorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.searchUserAllowListTile().should('exist')
    menuPage.searchUserAllowListLink().should('contain.text', 'Search the localhost user allow list')
    menuPage
      .searchUserAllowListDescription()
      .should('contain.text', 'Search for a user and update their access to localhost')
  })

  it('Does not show Search User Allow List tile for unauthorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()
    MenuPage.verifyOnPage().searchUserAllowListTile().should('not.exist')
  })

  it('Shows Add User to Allow List tile for authorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MANAGE_USER_ALLOW_LIST' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()
    menuPage.addUserToAllowListTile().should('exist')
    menuPage.addUserToAllowListLink().should('contain.text', 'Add a user to the localhost allow list')
    menuPage.addUserToAllowListDescription().should('contain.text', 'Add an existing user to the localhost allow list')
  })

  it('Does not show Add User to Allow List tile for unauthorised user', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()
    MenuPage.verifyOnPage().addUserToAllowListTile().should('not.exist')
  })
})
