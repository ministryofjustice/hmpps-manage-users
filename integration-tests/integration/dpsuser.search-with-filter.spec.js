const { goToSearchWithFilterPage } = require('../support/dpsuser.helpers')

context('DPS search with filter user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})
    searchWithFilter.filter().should('exist')
  })

  it('can add and remove user filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})

    searchWithFilter.filterUser('Andy')
    searchWithFilter.filterWithTag('Andy').should('exist')
    searchWithFilter.userFilterInput().should('have.value', 'Andy')

    searchWithFilter.filterWithTag('Andy').click()
    searchWithFilter.filterWithTag('Andy').should('not.exist')
    searchWithFilter.userFilterInput().should('have.value', '')
  })

  it('can change default ALL status to active or inactive only', () => {
    const searchWithFilter = goToSearchWithFilterPage({})
    searchWithFilter.statusFilterRadioButton('All').should('be.checked')

    searchWithFilter.filterStatus('Inactive')
    searchWithFilter.statusFilterRadioButton('Inactive').should('be.checked')
    searchWithFilter.filterWithTag('Inactive').should('exist')

    searchWithFilter.filterStatus('Active')
    searchWithFilter.statusFilterRadioButton('Active').should('be.checked')
    searchWithFilter.filterWithTag('Active').should('exist')

    searchWithFilter.filterStatus('All')
    searchWithFilter.statusFilterRadioButton('All').should('be.checked')
    searchWithFilter.filterWithTag('All').should('not.exist')
  })
})
