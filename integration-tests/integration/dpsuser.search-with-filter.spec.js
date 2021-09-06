const { goToSearchWithFilterPage } = require('../support/dpsuser.helpers')

context('DPS search with filter user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 0 })
    searchWithFilter.filter().should('exist')
  })

  it('can add and remove user filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 0 })

    searchWithFilter.filterUser('Andy')
    searchWithFilter.filterWithTag('Andy').should('exist')
    searchWithFilter.userFilterInput().should('have.value', 'Andy')

    searchWithFilter.filterWithTag('Andy').click()
    searchWithFilter.filterWithTag('Andy').should('not.exist')
    searchWithFilter.userFilterInput().should('have.value', '')
  })
})
