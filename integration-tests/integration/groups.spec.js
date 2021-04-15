const GroupsPage = require('../pages/groupsPage')
const MenuPage = require('../pages/menuPage')
const GroupDetailsPage = require('../pages/groupDetailsPage')
const GroupNameChangePage = require('../pages/groupNameChangePage')
const ChildGroupNameChangePage = require('../pages/childGroupNameChangePage')
const CreateChildGroupPage = require('../pages/createChildGroupPage')
const CreateGroupPage = require('../pages/createGroupPage')
const GroupDeletePage = require('../pages/groupDeletePage')

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
    MenuPage.verifyOnPage().manageGroups()
    const groups = GroupsPage.verifyOnPage()

    groups.searchGroup('SOCU')
    groups.group().should('have.value', 'SOCU North West').clear()
    groups.searchGroup('PECS')
    groups.group().should('have.value', 'PECS Police Force Thames Valley')
  })

  it('Should display message if no groups available', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroups', { content: [] })
    cy.visit('/manage-groups')

    const groups = GroupsPage.verifyOnPage()
    groups.noGroups().should('contain', 'a member of any groups.')
  })

  it('should display group details', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups')
    const groups = GroupsPage.verifyOnPage()
    groups.searchGroup('SOCU').click()

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.assignableRoles().should('have.length', 2)
    groupDetails.childGroups().should('have.length', 1)
  })

  it('should allow change group name', () => {
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

  it('should display error when delete group if child groups exist', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.deleteGroupChildLink()
    groupDetails
      .errorSummary()
      .should('contain.text', 'You must delete all child groups before you can delete the group')
  })

  it('should display error when attempt to view group that does not exist', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroups', {})
    cy.visit('/manage-groups')

    cy.visit('/manage-groups/DOES_NOT_EXIST')
    const groups = GroupsPage.verifyOnPage()
    groups.errorSummary().should('contain.text', 'Group does not exist')
  })

  it('should display error when attempt to delete group that does not exist', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthAssignableGroups', {})
    cy.visit('/manage-groups')

    cy.visit('/manage-groups/DOES_NOT_EXIST/delete/children/none')
    const groups = GroupsPage.verifyOnPage()
    groups.errorSummary().should('contain.text', 'Group does not exist')
  })

  it('should allow delete group if no child groups', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthGroupDetailsNoChildren', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.deleteGroupNoChildLink()

    cy.task('stubAuthDeleteGroup')
    cy.task('stubAuthAssignableGroups', {})
    const groupDelete = GroupDeletePage.verifyOnPage()
    groupDelete.groupDelete()

    GroupsPage.verifyOnPage()
  })

  it('should allow change child group name', () => {
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

  it('should allow create child group', () => {
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

    cy.task('verifyCreateChildGroup').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal({
        groupCode: 'BOB',
        groupName: 'Bob Group',
        parentGroupCode: 'SITE_1_GROUP_2',
      })
    })
  })

  it('should allow create group', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    const menuPage = MenuPage.verifyOnPage()

    cy.task('stubAuthAssignableGroupDetails', {})
    menuPage.createGroup()

    cy.task('stubAuthCreateGroup')
    CreateGroupPage.verifyOnPage()
    cy.task('stubAuthAssignableGroupDetails', {})
    const createGroup = CreateGroupPage.verifyOnPage()
    createGroup.createGroup('BO$', '')
    createGroup.errorSummary().should('contain.text', 'Enter a group name')

    createGroup.createGroup('BO$', 'Bob Group')
    createGroup.errorSummary().should('contain.text', 'Group code can only contain 0-9, A-Z and _ characters')

    createGroup.createGroup('', '')
    createGroup.createGroup('BOB', 'Bob Group')
    GroupDetailsPage.verifyOnPage('Site 1 - Group 2')

    cy.task('verifyCreateGroup').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal({
        groupCode: 'BOB',
        groupName: 'Bob Group',
      })
    })
  })

  it('should allow delete child group', () => {
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

  it('Manage your details contain returnTo url for current group detail page', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    cy.task('stubAuthAssignableGroupDetails', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')

    groupDetails
      .manageYourDetails()
      .should('contain', 'Manage your details')
      .and('have.attr', 'href')
      .and('contains', '%2Fmanage-groups%2FSITE_1_GROUP_2')
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
  const groupDetailsAfterCreateGroup = {
    content: {
      groupCode: 'SITE_1_GROUP_2',
      groupName: 'Site 1 - Group 2',
      assignableRoles: [],
      children: [],
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
