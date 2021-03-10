const MenuPage = require('../pages/menuPage')
const DpsUserSearchPage = require('../pages/dpsUserSearchPage')
const UserSearchResultsPage = require('../pages/userSearchResultsPage')
const UserPage = require('../pages/userPage')

const searchForUser = (totalElements) => {
  cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
  cy.login()
  const menuPage = MenuPage.verifyOnPage()
  cy.task('stubDpsGetRoles', { content: [] })
  menuPage.searchDpsUsers()
  const search = DpsUserSearchPage.verifyOnPage()

  cy.task('stubDpsSearch', { totalElements })
  search.search('sometext')

  const results = UserSearchResultsPage.verifyOnPage()
  results.rows().should('have.length', 2)
  return results
}

function goToResultsPage() {
  cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
  cy.login()
  cy.task('stubDpsGetRoles', { content: [] })
  cy.task('stubDpsSearch', { totalElements: 21 })

  const search = DpsUserSearchPage.goTo()
  search.search('sometext@somewhere.com')
  const results = UserSearchResultsPage.verifyOnPage()
  results.nextPage()
  return results
}

context('DPS user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should display a message if no search results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    cy.task('stubDpsGetRoles', { content: [] })
    const search = DpsUserSearchPage.goTo()
    cy.task('stubDpsSearch', { totalElements: 0 })
    search.search('nothing doing')
    const results = UserSearchResultsPage.verifyOnPage()
    results.noResults().should('contain.text', 'No records found')
  })

  it('Should allow a user search by name and display results', () => {
    const results = searchForUser(2)

    results
      .rows()
      .eq(0)
      .find('td')
      .then(($tableCells) => {
        // \u00a0 is a non breaking space, won't match on ' ' though
        expect($tableCells.get(0)).to.contain.text('Itag\u00a0User0')
        expect($tableCells.get(1)).to.contain.text('ITAG_USER0')
        expect($tableCells.get(2)).to.contain.text('BXI')
        expect($tableCells.get(3)).to.contain.text('Yes')
      })

    cy.task('stubDpsSearch', { totalElements: 5 })
    const search = DpsUserSearchPage.goTo()
    search.search('sometext@somewhere.com')

    results.rows().should('have.length', 5)
    results.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    results.rows().eq(1).should('include.text', 'Itag\u00a0User1')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')
  })

  it('Should allow a user search by role and display results', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    cy.task('stubDpsGetRoles', {})
    const searchRole = DpsUserSearchPage.goTo()
    cy.task('stubDpsSearch', {})
    searchRole.searchRole('Maintain Roles')
    UserSearchResultsPage.verifyOnPage()

    cy.task('verifyDpsSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: ['MAINTAIN_ACCESS_ROLES'] },
      })
    })
  })

  it('Should allow a user search and display paged results', () => {
    const results = goToResultsPage()

    results.rows().should('have.length', 10)
    results.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    results.rows().eq(1).should('include.text', 'Itag\u00a0User1')
    results.rows().eq(2).should('include.text', 'Itag\u00a0User2')
    results.rows().eq(3).should('include.text', 'Itag\u00a0User3')
    results.rows().eq(4).should('include.text', 'Itag\u00a0User4')

    results.getPaginationResults().should('contain.text', 'Showing 1 to 10 of 21 results')
  })

  it('Should move between paged result when next page and previous page selected', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    cy.task('stubDpsGetRoles', {})
    cy.task('stubDpsSearch', { totalElements: 21, page: 1, size: 5 })

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
      })

      expect(requests[0].headers).to.include({ 'page-offset': '0', 'page-limit': '20' })
      expect(requests[1].headers).to.include({ 'page-offset': '10', 'page-limit': '20' })
      expect(requests[2].headers).to.include({ 'page-offset': '0', 'page-limit': '20' })
    })
  })

  it('Should display details for a user ', () => {
    const results = goToResultsPage()

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubEmail', { username: 'ITAG_USER' })

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage.userRows().eq(1).should('contain', 'ITAG_USER@gov.uk')
    userPage.roleRows().should('have.length', 2)
    userPage.roleRows().eq(0).should('contain', 'Maintain Roles')
    userPage.roleRows().eq(1).should('contain', 'Another general role')
  })

  it('Should leave email blank if no verified email for user ', () => {
    const results = goToResultsPage()

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubMissingEmail')

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage.userRows().eq(0).should('contain', 'ITAG_USER')
    userPage
      .userRows()
      .eq(1)
      .then(($cell) => {
        expect($cell.text().trim()).to.equal('Verified email')
      })
  })

  it('Should provide breadcrumb link back to search results', () => {
    const results = goToResultsPage()

    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubEmail', { username: 'ITAG_USER' })

    results.edit('ITAG_USER5')
    const userPage = UserPage.verifyOnPage('Itag User')
    userPage
      .searchResultsBreadcrumb()
      .should('have.attr', 'href', '/search-dps-users/results?user=sometext%40somewhere.com&roleCode=&offset=10')
  })

  it('Manage your details contain returnTo url for current dps search page', () => {
    cy.task('stubLogin', { roles: [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] })
    cy.login()
    cy.task('stubDpsGetRoles', { content: [] })
    const search = DpsUserSearchPage.goTo()
    search
      .manageYourDetails()
      .should('contain', 'Manage your details')
      .and('have.attr', 'href')
      .and('contains', '%2Fsearch-dps-users')
  })
})
