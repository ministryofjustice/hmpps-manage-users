const GroupsPage = require('../pages/groupsPage')

context('Groups', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display all groups', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroups', {})

    cy.visit('/manage-groups')
    const groups = GroupsPage.verifyOnPage()

    groups.groupRows().should('have.length', 3)
    groups.groupRows().eq(0).should('contain.text', 'SOCU North West')
    groups.groupRows().eq(1).should('contain.text', 'PECS Police Force Thames Valley')
  })

  it('Should display message if no groups available', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroups', { content: [] })
    cy.visit('/manage-groups')

    const groups = GroupsPage.verifyOnPage()
    groups.noGroups().should('contain', 'a member of any groups.')
  })
})
