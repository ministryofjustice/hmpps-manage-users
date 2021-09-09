const RolesPage = require('../pages/rolesPage')
const MenuPage = require('../pages/menuPage')
const { replicateRoles } = require('../support/roles.helpers')
const RoleDetailsPage = require('../pages/roleDetailsPage')
const RoleNameChangePage = require('../pages/roleNameChangePage')
const GroupDetailsPage = require('../pages/groupDetailsPage')
const CreateRolePage = require('../pages/createRolePage')

context('Roles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display all roles', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRoles', {})
    MenuPage.verifyOnPage().manageRoles()

    const roles = RolesPage.verifyOnPage()

    roles.rows().should('have.length', 3)
    roles.rows().eq(0).should('contain.text', 'Auth Group Manager')
    roles.rows().eq(1).should('contain.text', 'Global Search')
    roles.rows().eq(2).should('contain.text', 'Licence Responsible Officer')
  })

  it('Should display paged results for all roles', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()
    cy.task('stubAllRoles', {
      content: replicateRoles(5),
      totalElements: 21,
      page: 0,
      size: 5,
    })
    MenuPage.verifyOnPage().manageRoles()

    const roles = RolesPage.verifyOnPage()

    roles.rows().should('have.length', 5)

    roles.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 21 results')
  })

  it('Should move between paged result when next page and previous page selected', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()
    cy.task('stubAllRoles', {
      content: replicateRoles(5),
      totalElements: 21,
      page: 1,
      size: 5,
    })

    MenuPage.verifyOnPage().manageRoles()

    const roles = RolesPage.verifyOnPage()
    roles.rows().should('have.length', 5)

    roles.getPaginationResults().should('contain.text', 'Showing 6 to 10 of 21 results')
    roles.nextPage()
    roles.previousPage()
    cy.task('verifyAllRoles').should((requests) => {
      expect(requests).to.have.lengthOf(3)

      expect(requests[0].queryParams).to.deep.equal({
        page: { key: 'page', values: ['0'] },
        size: { key: 'size', values: ['20'] },
      })

      expect(requests[1].queryParams.page).to.deep.equal({
        key: 'page',
        values: ['2'],
      })

      expect(requests[2].queryParams.page).to.deep.equal({
        key: 'page',
        values: ['0'],
      })
    })
  })

  it('should display role details', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRoles', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles')
    const roles = RolesPage.verifyOnPage()

    roles.rows().should('have.length', 3)
    roles.rows().eq(0).should('contain.text', 'Auth Group Manager')
    roles.rows().get('[data-qa="edit-button-Auth Group Manager"]').click()

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.adminTypes().should('have.length', 1)
  })

  it('should allow change role name', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRoles', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles/AUTH_GROUP_MANAGER')

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.changeRoleName()

    cy.task('stubAuthChangeRoleName')
    cy.task('stubRoleDetails', roleDetailsAfterRoleNameChange)
    const roleNameChange = RoleNameChangePage.verifyOnPage()
    roleNameChange.changeName('Name Change')

    RoleDetailsPage.verifyOnPage('New Role Name')
    cy.task('verifyRoleNameUpdate').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({
        roleName: 'Name Change',
      })
    })
  })

  const roleDetailsAfterRoleNameChange = {
    content: {
      roleCode: 'AUTH_GROUP_MANAGER',
      roleName: 'New Role Name',
    },
  }

  it('should allow create role', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createRole()

    cy.task('stubAuthCreateRole')
    CreateRolePage.verifyOnPage()
    cy.task('stubRoleDetails', {})
    const createRole = CreateRolePage.verifyOnPage()
    createRole.createRole('BO$', '', '', '')
    createRole.errorSummary().should('contain.text', 'Enter a role name')

    createRole.createRole('BO$', 'Bob Role', 'Bob Description', 'EXT_ADM')
    createRole.errorSummary().should('contain.text', 'Role code can only contain 0-9, A-Z and _ characters')

    createRole.createRole('', '')
    createRole.createRole('AUTH_GROUP_MANAGER', 'Auth Group Manager', 'Role to be a Group Manager', 'EXT_ADM')
    RoleDetailsPage.verifyOnPage('Auth Group Manager')

    cy.task('verifyCreateRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal({
        roleCode: 'AUTH_GROUP_MANAGER',
        roleName: 'Auth Group Manager',
        roleDescription: 'Role to be a Group Manager',
        adminType: ['EXT_ADM'],
      })
    })
  })
})
