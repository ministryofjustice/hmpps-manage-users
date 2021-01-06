const GroupsPage = require('../pages/groupsPage')
const GroupDetailsPage = require('../pages/groupDetailsPage')
const GroupNameChangePage = require('../pages/groupNameChangePage')
const ChildGroupNameChangePage = require('../pages/childGroupNameChangePage')

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

  it(' should display group details', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage()
    groupDetails.assignableRoles().should('have.length', 2)
    groupDetails.childGroups().should('have.length', 1)
  })

  it(' should allow change group name', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage()
    groupDetails.changeGroupName()

    cy.task('stubAuthChangeGroupName')
    const groupNameChange = GroupNameChangePage.verifyOnPage()
    groupNameChange.changeName('a')

    GroupDetailsPage.verifyOnPage()
  })

  it(' should allow change child group name', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage()
    groupDetails.changeChildGroupName()

    cy.task('stubAuthChangeChildGroupName')
    const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
    childGroupNameChange.changeName('a')

    GroupDetailsPage.verifyOnPage()
  })

  it('should return user to previous page if user cancels action', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage()
    groupDetails.changeChildGroupName()

    const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
    childGroupNameChange.cancel()
    GroupDetailsPage.verifyOnPage()
  })
})
