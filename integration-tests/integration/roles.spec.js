const RolesPage = require('../pages/rolesPage')
const MenuPage = require('../pages/menuPage')
const { replicateRoles } = require('../support/roles.helpers')
const RoleDetailsPage = require('../pages/roleDetailsPage')
const RoleNameChangePage = require('../pages/roleNameChangePage')
const RoleDescriptionChangePage = require('../pages/roleDescriptionChangePage')
const RoleAdminTypeChangePage = require('../pages/roleAdminTypeChangePage')

const CreateRolePage = require('../pages/createRolePage')

context('Roles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display paged results for all roles', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()
    cy.task('stubAllRolesPaged', {
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
    cy.task('stubAllRolesPaged', {
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
        roleName: { key: 'roleName', values: [''] },
        roleCode: { key: 'roleCode', values: [''] },
        adminTypes: { key: 'adminTypes', values: [''] },
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

    cy.task('stubAllRolesPaged', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles')
    const roles = RolesPage.verifyOnPage()

    roles.rows().should('have.length', 3)
    roles.rows().eq(0).should('contain.text', 'Auth Group Manager')
    roles.rows().get('[data-qa="edit-button-Auth Group Manager"]').click()

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.adminType().should('have.length', 1)
  })

  it('should allow change role name', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRolesPaged', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles/AUTH_GROUP_MANAGER')

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.changeRoleName()

    cy.task('stubChangeRoleName')
    cy.task('stubRoleDetails', roleDetailsAfterRoleNameChange)
    const roleNameChange = RoleNameChangePage.verifyOnPage('Auth Group Manager')
    roleNameChange.changeName('Name Change')

    RoleDetailsPage.verifyOnPage('New Role Name')
    cy.task('verifyRoleNameUpdate').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({
        roleName: 'Name Change',
      })
    })
  })

  it('should allow change role description', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRolesPaged', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles/AUTH_GROUP_MANAGER')

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.changeRoleDescription()

    cy.task('stubChangeRoleDescription')
    cy.task('stubRoleDetails', roleDetailsAfterRoleDescriptionChange)
    const roleDescriptionChange = RoleDescriptionChangePage.verifyOnPage('Auth Group Manager')
    roleDescriptionChange.changeDescription('Description Change')

    RoleDetailsPage.verifyOnPage('Role Description Change Name')
    cy.task('verifyRoleDescriptionUpdate').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({
        roleDescription: 'Description Change',
      })
    })
  })

  it('should allow change role admin type', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRolesPaged', {})
    cy.task('stubRoleDetails', {})
    cy.visit('/manage-roles/AUTH_GROUP_MANAGER')

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.changeRoleAdminType()

    cy.task('stubChangeRoleAdminType')
    cy.task('stubRoleDetails', roleDetailsAfterRoleAdminTypeChange)
    const roleAdminTypeChange = RoleAdminTypeChangePage.verifyOnPage('Auth Group Manager')
    roleAdminTypeChange.adminTypeCheckbox('External Administrators').should('be.checked').should('be.disabled')
    roleAdminTypeChange.adminTypeCheckbox('External Administrators').should('be.disabled')
    roleAdminTypeChange.changeRoleAdminType('DPS_ADM')

    RoleDetailsPage.verifyOnPage('Role Name For Admin Type Change')

    cy.task('verifyRoleAdminTypeUpdate').should((requests) => {
      expect(requests).to.have.lengthOf(1)
      expect(JSON.parse(requests[0].body)).to.deep.equal({
        adminType: ['DPS_ADM', 'EXT_ADM'],
      })
    })
  })

  it('change role admin type call to nomis fails - error shown', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()

    cy.task('stubAllRolesPaged', {})
    cy.task('stubDPSRoleDetails', {})
    cy.visit('/manage-roles/AUTH_GROUP_MANAGER')

    const roleDetails = RoleDetailsPage.verifyOnPage('Auth Group Manager')
    roleDetails.changeRoleAdminType()

    cy.task('stubChangeRoleAdminTypeFail')
    cy.task('stubDPSRoleDetails', {})
    const roleAdminTypeChange = RoleAdminTypeChangePage.verifyOnPage('Auth Group Manager')
    roleAdminTypeChange.adminTypeCheckbox('DPS Central Admin').should('be.checked').should('be.disabled')
    roleAdminTypeChange.changeRoleAdminType('DPS_LSA')

    const roleAdminTypeChange2 = RoleAdminTypeChangePage.verifyOnPage('Auth Group Manager')
    roleAdminTypeChange2
      .errorSummary()
      .should('contain.text', 'Unexpected error: Unable to get role: AUTH_GROUP_MANAGER with reason: notfound')

    roleAdminTypeChange2.adminTypeCheckbox('DPS Central Admin').should('be.checked').should('be.disabled')
    roleAdminTypeChange2.adminTypeCheckbox('DPS Local System Administrators (LSA)').should('be.checked')

    roleAdminTypeChange2.cancel()
    RoleDetailsPage.verifyOnPage('Auth Group Manager')
  })

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
    createRole.errorSummary().should('contain.text', 'Select an admin type')

    createRole.createRole('BO$', 'Bob Role', 'Bob Description', 'EXT_ADM')
    createRole.errorSummary().should('contain.text', 'Role code can only contain 0-9, A-Z and _ characters')
    createRole.adminTypeCheckbox('External Administrators').should('be.checked')

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

  it('should allow create role', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'ROLES_ADMIN' }] })
    cy.signIn()
    const menuPage = MenuPage.verifyOnPage()

    menuPage.createRole()

    cy.task('stubAuthCreateRole')
    CreateRolePage.verifyOnPage()
    cy.task('stubRoleDetails', {})
    const createRole = CreateRolePage.verifyOnPage()
    createRole.createRole('ROLE_AUTH_GROUP_MANAGER', 'Auth Group Manager', 'Role to be a Group Manager', 'EXT_ADM')
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

  const roleDetailsAfterRoleAdminTypeChange = {
    content: {
      roleCode: 'AUTH_GROUP_MANAGER',
      roleName: 'Role Name For Admin Type Change',
      roleDescription: 'Role Description',
      adminType: [
        {
          adminTypeName: 'External Admin',
          adminTypeCode: 'EXT_ADM',
        },
      ],
    },
  }
  const roleDetailsAfterRoleNameChange = {
    content: {
      roleCode: 'AUTH_GROUP_MANAGER',
      roleName: 'New Role Name',
    },
  }
  const roleDetailsAfterRoleDescriptionChange = {
    content: {
      roleCode: 'AUTH_GROUP_MANAGER',
      roleName: 'Role Description Change Name',
      roleDescription: 'New Role Description',
    },
  }
})
