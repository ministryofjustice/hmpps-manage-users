const GroupsPage = require('../pages/groupsPage')
const MenuPage = require('../pages/menuPage')
const GroupDetailsPage = require('../pages/groupDetailsPage')
const GroupNameChangePage = require('../pages/groupNameChangePage')
const ChildGroupNameChangePage = require('../pages/childGroupNameChangePage')
const CreateChildGroupPage = require('../pages/createChildGroupPage')
const CreateGroupPage = require('../pages/createGroupPage')
const GroupDeletePage = require('../pages/groupDeletePage')
const AuthErrorPage = require('../pages/authErrorPage')
const ExternalUserSearchPage = require('../pages/authUserSearchPage')
const { replicateUser } = require('../support/externaluser.helpers')

context('Groups', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display all groups with hyperlinks if 10 or less', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', {})
    MenuPage.verifyOnPage().manageGroups()

    const groups = GroupsPage.verifyOnPage()

    groups.groupRows().should('have.length', 4)
    groups.groupRows().eq(0).should('contain.text', 'SOCU North West')
    groups.groupRows().eq(1).should('contain.text', 'PECS Police Force Thames Valley')
  })

  it('Should display filter for groups if more than 10', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', { content: duplicateGroup(11) })
    MenuPage.verifyOnPage().manageGroups()
    const groups = GroupsPage.verifyOnPage()

    groups.searchGroup('SOCU')
    groups.group().should('have.value', 'SOCU North West 0').clear()
    groups.searchGroup('10')
    groups.group().should('have.value', 'SOCU North West 10')
  })

  it('Should display message if no groups available', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', { content: [] })
    cy.visit('/manage-groups')

    const groups = GroupsPage.verifyOnPage()
    groups.noGroups().should('contain', 'a member of any groups.')
  })

  it('should display group details', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', {})
    cy.task('stubGroupDetailsWithChildren', {})
    cy.visit('/manage-groups')
    const groups = GroupsPage.verifyOnPage()

    groups.groupRows().should('have.length', 4)
    groups.groupRows().eq(0).should('contain.text', 'SOCU North West')
    groups.groupRows().get('[data-qa="edit-button-SOCU North West"]').click()

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.assignableRoles().should('have.length', 2)
    groupDetails.childGroups().should('have.length', 1)
  })

  it('should display group details and then allow to search users from link', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', {})
    cy.task('stubGroupDetailsWithChildren', {})
    cy.visit('/manage-groups')
    const groups = GroupsPage.verifyOnPage()
    groups.groupRows().get('[data-qa="edit-button-Site 1 - Group 2"]').click()

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    cy.task('stubAssignableGroups', { content: undefined })
    cy.task('stubExtSearchableRoles', {})
    cy.task('stubExternalUserSearch', {
      content: replicateUser(1),
      totalElements: 1,
      page: 0,
      size: 1,
    })
    groupDetails.searchUsers()

    ExternalUserSearchPage.verifyOnPage()
  })

  describe('Change group name', () => {
    it('should allow change group name', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()

      cy.task('stubGroupDetailsWithChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.changeGroupName()

      cy.task('stubChangeGroupName')
      cy.task('stubGroupDetailsWithChildren', groupDetailsAfterGroupNameChange)
      const groupNameChange = GroupNameChangePage.verifyOnPage()
      groupNameChange.changeName('Name Change')

      GroupDetailsPage.verifyOnPage('New Group Name')
    })

    it('Should check for CSRF token', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-groups/SITE_1_GROUP_2/change-group-name',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Delete a group', () => {
    it('should display error when delete group if child groups exist', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      cy.task('stubGroupDetailsWithChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.deleteGroupChildLink()
      groupDetails
        .errorSummary()
        .should('contain.text', 'You must delete all child groups before you can delete the group')
    })

    it('should display error when attempt to delete group that does not exist', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      cy.task('stubAssignableGroups', {})
      cy.task('stubGroupDetailsFail', 'DOES_NOT_EXIST')

      cy.visit('/manage-groups')

      cy.visit('/manage-groups/DOES_NOT_EXIST/delete/children/none')
      const groups = GroupsPage.verifyOnPage()
      groups.errorSummary().should('contain.text', 'Group does not exist')
    })

    it('Should fail attempting to reach delete group directly if unauthorised', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'GROUP_MANAGER' }],
      })
      cy.signIn()
      MenuPage.verifyOnPage()

      cy.task('stubGroupDetailsNoChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.deleteGroupNoChild().should('not.exist')

      cy.visit('/manage-groups/SITE_1_GROUP_2/delete/children/none', { failOnStatusCode: false })
      AuthErrorPage.verifyOnPage()
    })

    it('Can access delete group directly if authorised', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()
      MenuPage.verifyOnPage()

      cy.task('stubGroupDetailsNoChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.deleteGroupNoChild().should('exist')

      cy.visit('/manage-groups/SITE_1_GROUP_2/delete/children/none')
      GroupDeletePage.verifyOnPage()
    })

    it('should allow delete group if no child groups', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      cy.task('stubGroupDetailsNoChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.deleteGroupNoChildLink()

      cy.task('stubManageUsersDeleteGroup')
      cy.task('stubAssignableGroups', {})
      const groupDelete = GroupDeletePage.verifyOnPage()
      groupDelete.groupDelete()

      GroupsPage.verifyOnPage()
    })
  })

  describe('Change child group name', () => {
    it('should allow change child group name', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()

      cy.task('stubGroupDetailsWithChildren', {})
      cy.task('stubGroupDetailsWithChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.changeChildGroupName()

      cy.task('stubChangeChildGroupName')
      cy.task('stubGroupDetailsWithChildren', groupDetailsAfterChildGroupNameChange)
      const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
      childGroupNameChange.changeName('New group name')

      const groupDetailsPage = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetailsPage.childGroups().eq(0).should('contain.text', 'New group name')
    })

    it('Should check for CSRF token', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-groups/SITE_1_GROUP_2/change-child-group-name/CHILD_1',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Create child group', () => {
    it('Should fail attempting to reach "create-group" if unauthorised', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'NOT_MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()
      MenuPage.verifyOnPage()

      cy.visit('/manage-groups/SITE_1_GROUP_2/create-group', { failOnStatusCode: false })
      AuthErrorPage.verifyOnPage()
    })

    it('should allow create child group', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      cy.task('stubGroupDetailsWithChildren', {})
      cy.visit('/manage-groups/SITE_1_GROUP_2')

      const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetails.createChildGroup()

      cy.task('stubCreateChildGroup')
      CreateChildGroupPage.verifyOnPage()
      cy.task('stubGroupDetailsWithChildren', groupDetailsAfterCreateChildGroup)
      const createChildGroup = CreateChildGroupPage.verifyOnPage()
      createChildGroup.createGroup('BOB', 'Bob Group')

      const groupDetailsPage = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
      groupDetailsPage.childGroups().should('have.length', 2)

      cy.task('verifyCreateChildGroup').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(JSON.parse(requests[0].body)).to.deep.include({
          groupCode: 'BOB',
          groupName: 'Bob Group',
          parentGroupCode: 'SITE_1_GROUP_2',
        })
      })
    })

    it('Should check for CSRF token', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-groups/SITE_1_GROUP_2/create-child-group',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  describe('Create group', () => {
    it('Should fail attempting to reach "create-group" if unauthorised', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'NOT_MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()

      menuPage.createGroupTile().should('not.exist')

      cy.visit('/create-group', { failOnStatusCode: false })
      AuthErrorPage.verifyOnPage()
    })

    it('should allow create group', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()

      cy.task('stubGroupDetailsWithChildren', {})
      menuPage.createGroup()

      cy.task('stubCreateGroup')
      CreateGroupPage.verifyOnPage()
      cy.task('stubGroupDetailsWithChildren', {})
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

        expect(JSON.parse(requests[0].body)).to.deep.include({
          groupCode: 'BOB',
          groupName: 'Bob Group',
        })
      })
    })

    it('Should check for CSRF token', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
      })
      cy.signIn()

      // Attempt to submit form without CSRF token:
      cy.request({
        method: 'POST',
        url: '/manage-groups/create-group',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.equal(500)
      })
    })
  })

  it('should allow delete child group', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubGroupDetailsWithChildren', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    cy.task('stubDeleteChildGroup')
    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    cy.task('stubGroupDetailsWithChildren', groupDetailsAfterDeleteChild)
    groupDetails.deleteChildGroup()

    const postActionGroupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    postActionGroupDetails.childGroupNotThere()
  })

  it('should display error when attempt to view group that does not exist', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubAssignableGroups', {})
    cy.task('stubGroupDetailsFail', 'DOES_NOT_EXIST')

    cy.visit('/manage-groups')

    cy.visit('/manage-groups/DOES_NOT_EXIST')
    const groups = GroupsPage.verifyOnPage()
    groups.errorSummary().should('contain.text', 'Group does not exist')
  })

  it('should return user to group detail page if user cancels action when changing child group name', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.signIn()

    cy.task('stubGroupDetailsWithChildren', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.changeChildGroupName()

    const childGroupNameChange = ChildGroupNameChangePage.verifyOnPage()
    childGroupNameChange.cancel()
    GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
  })

  it('should return user to group detail page if user cancels action when creating child group', () => {
    cy.task('stubSignIn', {
      roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }],
    })
    cy.signIn()

    cy.task('stubGroupDetailsWithChildren', {})
    cy.visit('/manage-groups/SITE_1_GROUP_2')

    const groupDetails = GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
    groupDetails.createChildGroup()

    const createChildGroup = CreateChildGroupPage.verifyOnPage()
    createChildGroup.cancel()
    GroupDetailsPage.verifyOnPage('Site 1 - Group 2')
  })

  it('Manage your details contain returnTo url for current group detail page', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.task('stubBannerNoMessage')
    cy.signIn()
    cy.task('stubGroupDetailsWithChildren', {})
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

  const duplicateGroup = (times) =>
    [...Array(times).keys()].map((i) => ({
      groupCode: `SOC_NORTH_WEST_${i}`,
      groupName: `SOCU North West ${i}`,
    }))
})
