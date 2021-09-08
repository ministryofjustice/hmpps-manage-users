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

  it('can add and remove a single caseload filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})

    searchWithFilter.filterCaseload('Moorland')
    searchWithFilter.filterWithTag('Moorland').should('exist')
    searchWithFilter.filterWithTag('Active caseload only').should('exist')
    searchWithFilter.activeCaseloadFilterRadioButton('Yes').should('be.checked')

    searchWithFilter.filterWithTag('Active caseload only').click()
    searchWithFilter.filterWithTag('Active caseload only').should('not.exist')
    searchWithFilter.activeCaseloadFilterRadioButton('Yes').should('not.be.checked')

    searchWithFilter.filterWithTag('Moorland').click()
    searchWithFilter.filterWithTag('Moorland').should('not.exist')
    searchWithFilter.activeCaseloadFilterRadioButton('Yes').should('be.checked')
  })
  it('can add and remove a single role filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})

    searchWithFilter.filterRole('User Admin')
    searchWithFilter.filterWithTag('User Admin').should('exist')

    searchWithFilter.filterWithTag('User Admin').click()
    searchWithFilter.filterWithTag('User Admin').should('not.exist')
  })

  it('wiill shows result before and after filtering', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 5 })
    searchWithFilter.rows().should('have.length', 5)
    searchWithFilter.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    searchWithFilter.rows().eq(1).should('include.text', 'Itag\u00a0User1')
    searchWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')

    cy.task('stubDpsAdminSearch', { totalElements: 3 })
    searchWithFilter.filterCaseload('Moorland')
    searchWithFilter.rows().should('have.length', 3)
    searchWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 3 of 3 results')
  })
  it('will call the admin search api when admin is logged in and no filter', () => {
    goToSearchWithFilterPage({ isAdmin: true, totalElements: 29 })
    cy.task('verifyDpsAdminSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: [''] },
        status: { key: 'status', values: ['ALL'] },
        caseload: { key: 'caseload', values: [''] },
        activeCaseload: { key: 'activeCaseload', values: [''] },
      })
    })
  })
  it('wiill call the admin search api when admin is logged in and has filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: true, totalElements: 29 })
    searchWithFilter.filterAll({
      user: 'Andy',
      statusText: 'Active',
      caseloadText: 'Moorland',
      roleText: 'User Admin',
    })

    cy.task('verifyDpsAdminSearch').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['Andy'] },
        accessRole: { key: 'accessRole', values: ['USER_ADMIN'] },
        status: { key: 'status', values: ['ACTIVE'] },
        caseload: { key: 'caseload', values: ['MDI'] },
        activeCaseload: { key: 'activeCaseload', values: ['MDI'] },
      })
    })
  })
  it('wiill call the dps search api when non-admin is logged in and no filter', () => {
    goToSearchWithFilterPage({ isAdmin: false, totalElements: 29 })
    cy.task('verifyDpsSearch').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRole: { key: 'accessRole', values: [''] },
        status: { key: 'status', values: ['ALL'] },
      })
    })
  })
  it('wiill call the dps search api when non-admin is logged in with filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: false, totalElements: 29 })
    searchWithFilter.filterAllNonAdmin({
      user: 'Andy',
      statusText: 'Active',
      roleText: 'User Admin',
    })

    cy.task('verifyDpsSearch').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['Andy'] },
        accessRole: { key: 'accessRole', values: ['USER_ADMIN'] },
        status: { key: 'status', values: ['ACTIVE'] },
      })
    })
  })
})
