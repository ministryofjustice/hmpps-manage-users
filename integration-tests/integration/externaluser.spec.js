const MenuPage = require('../pages/menuPage')
const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')
const UserAddRolePage = require('../pages/userAddRolePage')

const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `AUTH_ADM${i}`,
    email: `auth_test${i}@digital.justice.gov.uk`,
    enabled: i % 2 === 0,
    locked: i % 3 === 0,
    verified: i % 5 === 0,
    firstName: 'Auth',
    lastName: `Adm${i}`,
  }))

function searchForUser() {
  cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
  cy.login()
  const menuPage = MenuPage.verifyOnPage()
  cy.task('stubAuthAssignableGroups', { content: [] })
  cy.task('stubAuthSearchableRoles', { content: [] })
  menuPage.manageAuthUsers().click()
  const search = AuthUserSearchPage.verifyOnPage()

  cy.task('stubAuthSearch', {})
  search.search('sometext')

  const results = UserSearchResultsPage.verifyOnPage()
  results.rows().should('have.length', 1)
  return results
}

context('External user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display a message if no search results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', { content: [] })
    cy.task('stubAuthSearchableRoles', { content: [] })
    const search = AuthUserSearchPage.goTo()
    cy.task('stubAuthSearch', { content: [] })
    search.search('nothing doing')
    const results = UserSearchResultsPage.verifyOnPage()
    results.noResults().should('contain.text', 'No records found')
  })

  it('Should allow a user search by name and display results', () => {
    const results = searchForUser()

    results
      .rows()
      .eq(0)
      .find('td')
      .then(($tableCells) => {
        // \u00a0 is a non breaking space, won't match on ' ' though
        expect($tableCells.get(0)).to.contain.text('Auth\u00a0Adm')
        expect($tableCells.get(1)).to.contain.text('AUTH_ADM')
        expect($tableCells.get(2)).to.contain.text('auth_test2@digital.justice.gov.uk')
        expect($tableCells.get(3)).to.contain.text('No')
        expect($tableCells.get(4)).to.contain.text('Yes')
      })

    cy.task('stubAuthEmailSearch')
    const search = AuthUserSearchPage.goTo()
    search.search('sometext@somewhere.com')

    results.rows().should('have.length', 2)
    results.rows().eq(0).should('include.text', 'Auth\u00a0Adm')
    results.rows().eq(1).should('include.text', 'Auth\u00a0Expired')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 2 of 2 results')
  })

  it('Should allow a user search by group and display results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', {})
    cy.task('stubAuthSearchableRoles', {})
    const searchGroup = AuthUserSearchPage.goTo()
    cy.task('stubAuthSearch', { content: [] })
    searchGroup.searchGroup('SOCU North West')
    UserSearchResultsPage.verifyOnPage()

    cy.task('verifyAuthSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        groups: { key: 'groups', values: ['SOC_NORTH_WEST'] },
        name: { key: 'name', values: [''] },
        page: { key: 'page', values: ['0'] },
        roles: { key: 'roles', values: [''] },
        size: { key: 'size', values: ['20'] },
      })
    })
  })

  it('Should allow a user search by role and display results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', {})
    cy.task('stubAuthSearchableRoles', {})
    const searchGroup = AuthUserSearchPage.goTo()
    cy.task('stubAuthSearch', { content: [] })
    searchGroup.searchRole('Global Search')
    UserSearchResultsPage.verifyOnPage()

    cy.task('verifyAuthSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        groups: { key: 'groups', values: [''] },
        name: { key: 'name', values: [''] },
        page: { key: 'page', values: ['0'] },
        roles: { key: 'roles', values: ['GLOBAL_SEARCH'] },
        size: { key: 'size', values: ['20'] },
      })
    })
  })

  it('Should allow a user search and display paged results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', { content: [] })
    cy.task('stubAuthSearchableRoles', { content: [] })
    cy.task('stubAuthSearch', {
      content: replicateUser(5),
      totalElements: 21,
      page: 0,
      size: 5,
    })

    const search = AuthUserSearchPage.goTo()
    search.search('sometext@somewhere.com')
    const results = UserSearchResultsPage.verifyOnPage()
    results.rows().should('have.length', 5)
    results.rows().eq(0).should('include.text', 'Auth\u00a0Adm0')
    results.rows().eq(1).should('include.text', 'Auth\u00a0Adm1')
    results.rows().eq(2).should('include.text', 'Auth\u00a0Adm2')
    results.rows().eq(3).should('include.text', 'Auth\u00a0Adm3')
    results.rows().eq(4).should('include.text', 'Auth\u00a0Adm4')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 21 results')
  })

  it('Should move between paged result when next page and previous page selected', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()
    cy.task('stubAuthAssignableGroups', {})
    cy.task('stubAuthSearchableRoles', {})
    cy.task('stubAuthSearch', {
      content: replicateUser(5),
      totalElements: 21,
      page: 1,
      size: 5,
    })

    const search = AuthUserSearchPage.goTo()
    search.search('sometext@somewhere.com')
    const results = UserSearchResultsPage.verifyOnPage()
    results.rows().should('have.length', 5)

    results.getPaginationResults().should('contain.text', 'Showing 6 to 10 of 21 results')
    results.nextPage()
    results.previousPage()
    cy.task('verifyAuthSearch').should((requests) => {
      expect(requests).to.have.lengthOf(3)

      expect(requests[0].queryParams).to.deep.equal({
        groups: { key: 'groups', values: [''] },
        name: { key: 'name', values: ['sometext@somewhere.com'] },
        page: { key: 'page', values: ['0'] },
        roles: { key: 'roles', values: [''] },
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

  it('Should add and remove a role from a user', () => {
    const results = searchForUser()

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthUserRoles')
    cy.task('stubAuthUserGroups')
    results.edit('AUTH_ADM')

    const userPage = UserPage.verifyOnPage('Auth Adm')
    userPage.userRows().eq(0).should('contain', 'AUTH_ADM')
    userPage.userRows().eq(1).should('contain', 'auth_test2@digital.justice.gov.uk')

    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Global Search')

    cy.task('stubAuthAssignableRoles')
    userPage.addRole().click()
    const addRole = UserAddRolePage.verifyOnPage()

    cy.task('stubAuthAddRoles')
    addRole.choose('LICENCE_VARY')
    addRole.choose('LICENCE_RO')
    addRole.addRoleButton().click()

    cy.task('verifyAddRoles').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(JSON.parse(requests[0].body)).to.deep.equal(['LICENCE_RO', 'LICENCE_VARY'])
    })

    UserPage.verifyOnPage('Auth Adm')

    cy.task('stubAuthRemoveRole')
    userPage.removeRole('GLOBAL_SEARCH').click()

    cy.task('verifyRemoveRole').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].url).to.equal('/auth/api/authuser/AUTH_ADM/roles/GLOBAL_SEARCH')
    })
  })

  it('Should display message if no roles to add', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
    cy.login()

    cy.task('stubAuthGetUsername')
    cy.task('stubAuthAssignableRoles', [])
    cy.visit('/manage-external-users/AUTH_RO_USER_TEST/select-roles')
    const addRole = UserAddRolePage.verifyOnPage()
    addRole.noRoles().should('contain', 'There are no roles available for you to assign.')
  })
})
