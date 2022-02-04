import { parse } from 'csv-parse'

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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
      cy.task('stubAuthAssignableGroups', { content: [] })
      cy.task('stubAuthSearchableRoles', { content: [] })
      const search = AuthUserSearchPage.goTo()
      cy.task('stubAuthSearch', { content: [] })
      search.search('nothing doing')
      const results = UserSearchResultsPage.verifyOnPage()
      results.noResults().should('contain.text', 'No records found')
    })

    it('Should still show the filters if no search results', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }],
      })
      cy.signIn()
      cy.task('stubAuthAssignableGroups', { content: [] })
      cy.task('stubAuthSearchableRoles', { content: [] })
      const search = AuthUserSearchPage.goTo()
      cy.task('stubAuthSearch', { content: [] })
      search.search('nothing doing')
      const results = UserSearchResultsPage.verifyOnPage()
      results.noResults().should('contain.text', 'No records found')
      results.statusFilter().should('exist')
      results.caseloadFilter().should('not.exist')
      results.submitFilter().should('exist')
    })

    it('Should hide the caseload filter for external searches', () => {
      cy.task('stubSignIn', {
        roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }],
      })
      cy.signIn()
      cy.task('stubAuthAssignableGroups', { content: [] })
      cy.task('stubAuthSearchableRoles', { content: [] })
      const search = AuthUserSearchPage.goTo()
      cy.task('stubAuthSearch', { content: [] })
      search.search('nothing doing')
      const results = UserSearchResultsPage.verifyOnPage()
      results.noResults().should('contain.text', 'No records found')
      results.statusFilter().should('exist')
      results.caseloadFilter().should('not.exist')
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

    it('Should escape html tags in user names when displaying results', () => {
      const results = searchForUser('MAINTAIN_OAUTH_USERS', [
        {
          userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
          username: 'AUTH_ADM',
          email: 'auth_test2@digital.justice.gov.uk',
          enabled: true,
          locked: false,
          verified: false,
          firstName: '<script>document.write("XSS" + "Attack")</script>',
          lastName: '<script>document.write("XSS" + "Attack")</script>',
        },
      ])

      results.rows().eq(0).should('not.include.text', 'XSSAttack')
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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
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
      userSearchResults.statusFilter().should('have.value', 'ALL').select('INACTIVE')
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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
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
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
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

    it('Should allow a user to download all results', () => {
      const validateCsv = (list) => {
        expect(list, 'number of records').to.have.length(22)
        expect(list[0], 'header row').to.deep.equal([
          'userId',
          'username',
          'email',
          'enabled',
          'locked',
          'verified',
          'firstName',
          'lastName',
        ])
        expect(list[1], 'first row').to.deep.equal([
          '0',
          'AUTH_ADM0',
          'auth_test0@digital.justice.gov.uk',
          'true',
          'true',
          'true',
          'Auth',
          'Adm0',
        ])
        expect(list[21], 'last row').to.deep.equal([
          '20',
          'AUTH_ADM20',
          'auth_test20@digital.justice.gov.uk',
          'true',
          'false',
          'true',
          'Auth',
          'Adm20',
        ])
      }
      // A workaround for https://github.com/cypress-io/cypress/issues/14857
      let csv
      cy.intercept('GET', '*/download*', (req) => {
        req.reply((res) => {
          csv = res.body
          res.headers.location = '/'
          res.send(302)
        })
      }).as('csvDownload')

      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
      cy.task('stubAuthAssignableGroups', { content: [] })
      cy.task('stubAuthSearchableRoles', { content: [] })
      cy.task('stubAuthSearch', {
        content: replicateUser(5),
        totalElements: 21,
        page: 0,
        size: 5,
      })
      cy.task('stubAuthSearch', {
        content: replicateUser(21),
        totalElements: 21,
        page: 0,
        size: 10000,
      })

      const search = AuthUserSearchPage.goTo()
      search.search('sometext@somewhere.com')
      const results = UserSearchResultsPage.verifyOnPage()
      results.download().click()
      cy.wait('@csvDownload').then(() => {
        parse(csv, {}, (err, output) => {
          validateCsv(output)
        })
      })
      // attempt to ensure with go any other page except '/' which is where we go after
      // csv download - else next test fail to signin since we are already at '/'
      AuthUserSearchPage.goTo()
    })

    it('Should not show the download link for group managers', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'AUTH_GROUP_MANAGER' }] })
      cy.signIn()
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
      results.download().should('not.exist')
    })
  })
})
