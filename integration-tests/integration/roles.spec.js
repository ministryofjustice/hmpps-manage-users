const RolesPage = require('../pages/rolesPage')
const MenuPage = require('../pages/menuPage')
const { replicateRoles } = require('../support/roles.helpers')
const RoleDetailsPage = require('../pages/roleDetailsPage')

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
    // roles.rows().eq(0).should('include.text', 'Role\u00a0Name\u00a00')
    // roles.rows().eq(1).should('include.text', 'Role\u00a0Name\u00a01')
    // roles.rows().eq(2).should('include.text', 'Role\u00a0Name\u00a02')
    // roles.rows().eq(3).should('include.text', 'Role\u00a0Name\u00a03')
    // roles.rows().eq(4).should('include.text', 'Role\u00a0Name\u00a04')

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
    roleDetails.adminTypes().should('have.length', 2)
  })
})
