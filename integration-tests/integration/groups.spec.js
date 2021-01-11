const GroupsPage = require('../pages/groupsPage')
const GroupDetailsPage = require('../pages/groupDetailsPage')
const GroupNameChangePage = require('../pages/groupNameChangePage')
const ChildGroupNameChangePage = require('../pages/childGroupNameChangePage')
const CreateChildGroupPage = require('../pages/createChildGroupPage')

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

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.assignableRoles().should('have.length', 2)
    groupDetails.childGroups().should('have.length', 1)
  })

  it(' should allow change group name', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.changeGroupName()

    cy.task('stubAuthChangeGroupName')
    cy.task('stubAuthAssignableGroupDetails', groupDetailsAfterGroupNameChange)
    const groupNameChange = GroupNameChangePage.verifyOnPage()
    groupNameChange.changeName('Name Change')

    GroupDetailsPage.verifyOnPage('New Group Name')
  })

  it(' should allow change child group name', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.changeChildGroupName()

    cy.task('stubAuthChangeChildGroupName')
    cy.task('stubAuthAssignableGroupDetails', groupDetailsAfterChildGroupNameChange)
    const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
    childGroupNameChange.changeName('New group name')

    const groupDetailsPage = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetailsPage.childGroups().eq(0).should('contain.text', 'New group name')
  })

  it(' should allow create child group', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.createChildGroup()

    cy.task('stubAuthCreateChildGroup')
    CreateChildGroupPage.verifyOnPage()
    cy.task('stubAuthAssignableGroupDetails', groupDetailsAfterCreateChildGroup)
    const createChildGroup = CreateChildGroupPage.verifyOnPage()
    createChildGroup.createGroup('BOB', 'Bob Group')

    const groupDetailsPage = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetailsPage.childGroups().should('have.length', 2)
  })

  it(' should allow delete child group', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    cy.task('stubAuthDeleteChildGroup')
    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    cy.task('stubAuthAssignableGroupDetails', groupDetailsAfterDeleteChild)
    groupDetails.deleteChildGroup()

    const postActionGroupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    postActionGroupDetails.childGroupNotThere()
  })

  it('should return user to group detail page if user cancels action when changing child group name', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.changeChildGroupName()

    const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
    childGroupNameChange.cancel()
    GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
  })

  it('should return user to group detail page if user cancels action when creating child group', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.createChildGroup()

    const createChildGroup = CreateChildGroupPage.verifyOnPage()
    createChildGroup.cancel()
    GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
  })

  const groupDetailsAfterDeleteChild = {
    content: {
      groupCode: 'SITE_1_GROUP_2',
      groupName: 'Site 1 - Group 2',
      assignableRoles: [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
      ],
      children: [],
    },
  }

  const groupDetailsAfterCreateChildGroup = {
    content: {
      groupCode: 'SITE_1_GROUP_2',
      groupName: 'Site 1 - Group 2',
      assignableRoles: [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
      ],
      children: [
        { groupCode: 'CHILD_1', groupName: 'Child - Site 1 - Group 2' },
        { groupCode: 'BOB', groupName: 'Bob Group' },
      ],
    },
  }

  const groupDetailsAfterGroupNameChange = {
    content: {
      groupCode: 'SITE_1_GROUP_2',
      groupName: 'New Group Name',
      assignableRoles: [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
      ],
      children: [{ groupCode: 'CHILD_1', groupName: 'Child - Site 1 - Group 2' }],
    },
  }

  const groupDetailsAfterChildGroupNameChange = {
    content: {
      groupCode: 'SITE_1_GROUP_2',
      groupName: 'Site 1 - Group 2',
      assignableRoles: [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
      ],
      children: [{ groupCode: 'CHILD_1', groupName: 'New group name' }],
    },
  }
})
