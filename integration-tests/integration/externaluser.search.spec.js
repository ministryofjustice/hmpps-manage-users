const AuthUserSearchPage = require('../pages/authUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const { searchForUser, replicateUser } = require('../support/externaluser.helpers')

context('External user search functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  describe('search for a user', () => {
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

    it('Should still show the filters if no search results', () => {
      cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.login()
      cy.task('stubAuthAssignableGroups', { content: [] })
      cy.task('stubAuthSearchableRoles', { content: [] })
      const search = AuthUserSearchPage.goTo()
      cy.task('stubAuthSearch', { content: [] })
      search.search('nothing doing')
      const results = UserSearchResultsPage.verifyOnPage()
      results.noResults().should('contain.text', 'No records found')
      results.filter().should('exist')
      results.submitFilter().should('exist')
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
          expect($tableCells.get(1)).to.contain.text('auth_test2@digital.justice.gov.uk')
          expect($tableCells.get(2)).to.contain.text('Active')
          expect($tableCells.get(2)).not.to.contain.text('Locked')
          expect($tableCells.get(2)).not.to.contain.text('Inactive')
        })

      cy.task('stubAuthEmailSearch')
      const search = AuthUserSearchPage.goTo()
      search.search('sometext@somewhere.com')

      results.rows().should('have.length', 2)
      results.rows().eq(0).should('include.text', 'Auth\u00a0Adm')
      results.rows().eq(1).should('include.text', 'Auth\u00a0Expired')

      results.getPaginationResults().should('contain.text', 'Showing 1 to 2 of 2 results')
    })

    it('Should display locked and enabled tags', () => {
      const results = searchForUser('MAINTAIN_OAUTH_USERS', replicateUser(5))

      results.rows().eq(0).should('include.text', 'Locked')
      results.rows().eq(0).should('include.text', 'Active')
      results.rows().eq(0).should('not.include.text', 'Inactive')
      results.rows().eq(1).should('not.include.text', 'Locked')
      results.rows().eq(1).should('include.text', 'Inactive')
      results.rows().eq(1).should('not.include.text', 'Active')
      results.rows().eq(2).should('include.text', 'Active')
      results.rows().eq(2).should('not.include.text', 'Locked')
      results.rows().eq(2).should('not.include.text', 'Inactive')
      results.rows().eq(3).should('not.include.text', 'Active')
      results.rows().eq(3).should('include.text', 'Locked')
      results.rows().eq(3).should('include.text', 'Inactive')
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
          status: { key: 'status', values: ['ALL'] },
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
      cy.task('stubAuthSearch', {
        content: replicateUser(1),
        totalElements: 1,
        page: 0,
        size: 1,
      })
      searchGroup.searchRole('Global Search')
      UserSearchResultsPage.verifyOnPage()

      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(1)

        expect(requests[0].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: ['0'] },
          status: { key: 'status', values: ['ALL'] },
          roles: { key: 'roles', values: ['GLOBAL_SEARCH'] },
          size: { key: 'size', values: ['20'] },
        })
      })
    })

    it('Should filter results by status', () => {
      cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.login()
      cy.task('stubAuthAssignableGroups', {})
      cy.task('stubAuthSearchableRoles', {})
      const searchGroup = AuthUserSearchPage.goTo()
      cy.task('stubAuthSearch', {
        content: replicateUser(1),
        totalElements: 1,
        page: 0,
        size: 1,
      })
      searchGroup.searchRole('Global Search')
      const userSearchResults = UserSearchResultsPage.verifyOnPage()
      userSearchResults.filter().should('have.value', 'ALL').select('INACTIVE')
      userSearchResults.submitFilter().click()
      userSearchResults.checkStillOnPage()
      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(2)

        expect(requests[0].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: ['0'] },
          status: { key: 'status', values: ['ALL'] },
          roles: { key: 'roles', values: ['GLOBAL_SEARCH'] },
          size: { key: 'size', values: ['20'] },
        })
        expect(requests[1].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: ['0'] },
          status: { key: 'status', values: ['INACTIVE'] },
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
          status: { key: 'status', values: ['ALL'] },
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
  })
})
