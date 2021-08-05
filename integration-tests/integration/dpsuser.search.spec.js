const path = require('path')
const parse = require('csv-parse')
const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')

const { goToResultsPage } = require('../support/dpsuser.helpers')

context('DPS user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display a message if no search results', () => {
    const results = goToResultsPage({ totalElements: 0 })
    results.noResults().should('contain.text', 'No records found')
  })

  it('Should still show the filter if no search results', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', { content: [] })
    const search = DpsUserSearchPage.goTo()
    cy.task('stubDpsSearch', { totalElements: 0 })
    cy.task('stubAuthUserEmails')
    search.search('nothing doing')
    const results = UserSearchResultsPage.verifyOnPage()
    results.noResults().should('contain.text', 'No records found')
    results.statusFilter().should('exist')
    results.submitFilter().should('exist')
  })

  it('Should allow a user search by name and display results', () => {
    const results = goToResultsPage({})

    results
      .rows()
      .eq(0)
      .find('td')
      .then(($tableCells) => {
        // \u00a0 is a non breaking space, won't match on ' ' though
        expect($tableCells.get(0)).to.contain.text('Itag\u00a0User0')
        expect($tableCells.get(1)).to.contain.text('ITAG_USER0')
        expect($tableCells.get(2)).to.contain.text('dps-user@justice.gov.uk')
        expect($tableCells.get(3)).to.contain.text('BXI')
        expect($tableCells.get(4)).to.contain.text('Active')
      })

    cy.task('stubDpsSearch', { totalElements: 5 })
    cy.task('stubAuthUserEmails')
    const search = DpsUserSearchPage.goTo()
    search.search('sometext@somewhere.com')

    results.rows().should('have.length', 5)
    results.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    results.rows().eq(1).should('include.text', 'Itag\u00a0User1')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')
  })

  it('Should allow a user search by role and display results', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', {})
    const searchRole = DpsUserSearchPage.goTo()
    cy.task('stubDpsSearch', {})
    cy.task('stubAuthUserEmails')
    searchRole.searchRole('Maintain Roles')
    UserSearchResultsPage.verifyOnPage()

    cy.task('verifyDpsSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: ['MAINTAIN_ACCESS_ROLES'] },
        status: { key: 'status', values: ['ALL'] },
      })
    })
  })

  it('Should allow a user search by caseload and display results', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', {})
    cy.task('stubDpsGetCaseloads')
    const searchRole = DpsUserSearchPage.goTo()
    cy.task('stubDpsAdminSearch', { totalElements: 21 })
    cy.task('stubAuthUserEmails')
    searchRole.searchCaseload('Moorland')
    UserSearchResultsPage.verifyOnPage()

    cy.task('verifyDpsAdminSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: [''] },
        status: { key: 'status', values: ['ALL'] },
        caseload: { key: 'caseload', values: ['MDI'] },
        activeCaseload: { key: 'activeCaseload', values: ['MDI'] },
      })
    })
  })

  it('Should allow a user search and display paged results', () => {
    const results = goToResultsPage({})

    results.rows().should('have.length', 10)
    results.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    results.rows().eq(1).should('include.text', 'Itag\u00a0User1')
    results.rows().eq(2).should('include.text', 'Itag\u00a0User2')
    results.rows().eq(3).should('include.text', 'Itag\u00a0User3')
    results.rows().eq(4).should('include.text', 'Itag\u00a0User4')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 10 of 21 results')
  })

  it('Should move between paged result when next page and previous page selected', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', {})
    cy.task('stubDpsSearch', { totalElements: 21, page: 1, size: 5 })
    cy.task('stubAuthUserEmails')

    const search = DpsUserSearchPage.goTo()
    search.search('sometext@somewhere.com')
    const results = UserSearchResultsPage.verifyOnPage()
    results.rows().should('have.length', 5)

    results.getPaginationResults().should('contain.text', 'Showing 6 to 10 of 21 results')
    results.nextPage()
    results.previousPage()
    cy.task('verifyDpsSearch').should((requests) => {
      expect(requests).to.have.lengthOf(3)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['sometext@somewhere.com'] },
        accessRole: { key: 'accessRole', values: [''] },
        status: { key: 'status', values: ['ALL'] },
      })

      expect(requests[0].headers).to.include({ 'page-offset': '0', 'page-limit': '20' })
      expect(requests[1].headers).to.include({ 'page-offset': '10', 'page-limit': '20' })
      expect(requests[2].headers).to.include({ 'page-offset': '0', 'page-limit': '20' })
    })
  })

  it('Should filter results by status', () => {
    const results = goToResultsPage({ totalElements: 2 })

    results
      .rows()
      .eq(0)
      .find('td')
      .then(($tableCells) => {
        // \u00a0 is a non breaking space, won't match on ' ' though
        expect($tableCells.get(0)).to.contain.text('Itag\u00a0User0')
        expect($tableCells.get(1)).to.contain.text('ITAG_USER0')
        expect($tableCells.get(2)).to.contain.text('dps-user@justice.gov.uk')
        expect($tableCells.get(3)).to.contain.text('BXI')
        expect($tableCells.get(4)).to.contain.text('Active')
      })

    cy.task('stubDpsSearch', { totalElements: 5 })
    cy.task('stubAuthUserEmails')
    const search = DpsUserSearchPage.goTo()
    search.search('sometext@somewhere.com')

    results.rows().should('have.length', 5)
    results.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    results.rows().eq(1).should('include.text', 'Itag\u00a0User1')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')
    cy.task('stubDpsSearchInactive', { totalElements: 2 })
    results.statusFilter().should('have.value', 'ALL').select('INACTIVE')
    results.submitFilter().click()
    results.checkStillOnPage()

    results.rows().should('have.length', 2)
  })

  it('Should hide caseload filter for non admin users', () => {
    const results = goToResultsPage({ totalElements: 2 })

    cy.task('stubDpsSearch', { totalElements: 5 })
    cy.task('stubAuthUserEmails')
    const search = DpsUserSearchPage.goTo()
    search.search('sometext@somewhere.com')
    results.rows().should('have.length', 5)
    results.caseloadFilter().should('not.exist')
  })

  it('Should filter results by caseload', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', {})
    cy.task('stubDpsGetCaseloads')
    const searchRole = DpsUserSearchPage.goTo()
    cy.task('stubDpsAdminSearch', { totalElements: 21 })
    cy.task('stubAuthUserEmails')
    searchRole.searchCaseload('Moorland')
    const results = UserSearchResultsPage.verifyOnPage()

    // filter should copy value across from search page
    results.caseloadFilter().should('have.value', 'MDI').select('Any')

    results.submitFilter().click()
    results.checkStillOnPage()

    results.caseloadFilter().should('have.value', '')
    cy.task('verifyDpsAdminSearch').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: [''] },
        status: { key: 'status', values: ['ALL'] },
        caseload: { key: 'caseload', values: ['MDI'] },
        activeCaseload: { key: 'activeCaseload', values: [''] },
      })
    })
  })

  it('Should hide caseload search for LSAs (non admin)', () => {
    cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.signIn()
    cy.task('stubDpsGetRoles', {})
    const searchPage = DpsUserSearchPage.goTo()
    searchPage.caseload().should('not.exist')
  })

  it('Should allow a user to download all results', () => {
    const validateCsv = (list) => {
      expect(list, 'number of records').to.have.length(22)
      expect(list[0], 'header row').to.deep.equal([
        'username',
        'active',
        'firstName',
        'lastName',
        'activeCaseLoadId',
        'email',
      ])
      expect(list[1], 'first row').to.deep.equal([
        'ITAG_USER0',
        'true',
        'Itag',
        'User0',
        'BXI',
        'dps-user@justice.gov.uk',
      ])
      expect(list[21], 'last row').to.deep.equal(['ITAG_USER20', 'true', 'Itag', 'User20', 'BXI', ''])
    }
    const results = goToResultsPage({})
    cy.task('stubDpsSearch', { totalElements: 21, page: 0, size: 10000 })
    results.download().click()
    const filename = path.join(Cypress.config('downloadsFolder'), 'user-search.csv')
    cy.readFile(filename, { timeout: 15000 }).then((csv) => {
      parse(csv, {}, (err, output) => {
        validateCsv(output)
      })
    })
  })
})
