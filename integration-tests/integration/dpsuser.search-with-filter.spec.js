import { parse } from 'csv-parse'

const { goToSearchWithFilterPage, goToMainMenuPage } = require('../support/dpsuser.helpers')
const UserPage = require('../pages/userPage')

context('DPS search with filter user functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSyncDpsEmail')
  })

  it('Should show menu option for search page', () => {
    const menu = goToMainMenuPage({})
    menu.searchWithFilterDpsUsers().should('exist')
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
  it('can not see caseload filter when not an admin', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: false })

    searchWithFilter.caseload().should('not.exist')
  })
  it('can add and remove a single role filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})

    searchWithFilter.filterRole('User Admin')
    searchWithFilter.filterWithTag('User Admin').should('exist')

    searchWithFilter.filterWithTag('User Admin').click()
    searchWithFilter.filterWithTag('User Admin').should('not.exist')
  })
  it('can search for a role to filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({})

    searchWithFilter.role('Maintain Roles').should('be.visible')
    searchWithFilter.role('User Admin').should('be.visible')
    searchWithFilter.role('User General').should('be.visible')

    searchWithFilter.searchForRole('User')
    searchWithFilter.role('Maintain Roles').should('not.be.visible')
    searchWithFilter.role('User Admin').should('be.visible')
    searchWithFilter.role('User General').should('be.visible')

    searchWithFilter.searchForRole('Maintain')
    searchWithFilter.role('Maintain Roles').should('be.visible')
    searchWithFilter.role('User Admin').should('not.be.visible')
    searchWithFilter.role('User General').should('not.be.visible')

    searchWithFilter.searchForRole('')
    searchWithFilter.role('Maintain Roles').should('be.visible')
    searchWithFilter.role('User Admin').should('be.visible')
    searchWithFilter.role('User General').should('be.visible')
  })
  it('will shows result before and after filtering', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 5 })
    searchWithFilter.rows().should('have.length', 5)
    searchWithFilter.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    searchWithFilter.rows().eq(1).should('include.text', 'Itag\u00a0User1')
    searchWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')

    cy.task('stubDpsFindUsers', { totalElements: 3 })
    searchWithFilter.filterCaseload('Moorland')
    searchWithFilter.rows().should('have.length', 3)
    searchWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 3 of 3 results')
  })
  it('will show user details in the results', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 3 })
    searchWithFilter.rows().should('have.length', 3)
    searchWithFilter.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    searchWithFilter.rows().eq(0).should('include.text', 'ITAG_USER0@gov.uk')
    searchWithFilter.rows().eq(0).should('include.text', 'Active')
    searchWithFilter.rows().eq(0).should('include.text', 'Brixton (HMP)')
    searchWithFilter.rows().eq(0).should('include.text', 'No DPS roles')
    searchWithFilter.rows().eq(1).should('include.text', '1 DPS role')
    searchWithFilter.rows().eq(2).should('include.text', '2 DPS roles')
  })
  it('will have a link to maintain the user', () => {
    cy.task('stubDpsUserDetails')
    cy.task('stubDpsUserGetRoles')
    cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: true })
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 5 })
    searchWithFilter.manageLinkForUser('ITAG_USER0').click()
    UserPage.verifyOnPage('Itag User')
  })
  it('will call the find users api when admin is logged in and no filter', () => {
    goToSearchWithFilterPage({ isAdmin: true, totalElements: 29 })
    cy.task('verifyDpsFindUsers').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRoles: { key: 'accessRoles', values: [''] },
        status: { key: 'status', values: ['ALL'] },
        caseload: { key: 'caseload', values: [''] },
        activeCaseload: { key: 'activeCaseload', values: [''] },
        size: { key: 'size', values: ['20'] },
        page: { key: 'page', values: ['0'] },
      })
    })
  })
  it('will call the find users api when admin is logged in and has filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: true, totalElements: 29 })
    searchWithFilter.filterAll({
      user: 'Andy',
      statusText: 'Active',
      caseloadText: 'Moorland (HMP & YOI)',
      roleText: ['User Admin', 'User General'],
    })

    cy.task('verifyDpsFindUsers').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['Andy'] },
        accessRoles: { key: 'accessRoles', values: ['USER_ADMIN', 'USER_GENERAL'] },
        status: { key: 'status', values: ['ACTIVE'] },
        caseload: { key: 'caseload', values: ['MDI'] },
        activeCaseload: { key: 'activeCaseload', values: ['MDI'] },
        size: { key: 'size', values: ['20'] },
        page: { key: 'page', values: ['0'] },
      })
    })
  })
  it('will call the find users api when non-admin is logged in and no filter', () => {
    goToSearchWithFilterPage({ isAdmin: false, totalElements: 29 })
    cy.task('verifyDpsFindUsers').should((requests) => {
      expect(requests).to.have.lengthOf(1)

      expect(requests[0].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: [''] },
        accessRoles: { key: 'accessRoles', values: [''] },
        status: { key: 'status', values: ['ALL'] },
        caseload: { key: 'caseload', values: [''] },
        activeCaseload: { key: 'activeCaseload', values: [''] },
        size: { key: 'size', values: ['20'] },
        page: { key: 'page', values: ['0'] },
      })
    })
  })
  it('will call the find users api when non-admin is logged in with filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: false, totalElements: 29 })
    searchWithFilter.filterAllNonAdmin({
      user: 'Andy',
      statusText: 'Active',
      roleText: 'User Admin',
    })

    cy.task('verifyDpsFindUsers').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['Andy'] },
        accessRoles: { key: 'accessRoles', values: ['USER_ADMIN'] },
        status: { key: 'status', values: ['ACTIVE'] },
        caseload: { key: 'caseload', values: [''] },
        activeCaseload: { key: 'activeCaseload', values: [''] },
        size: { key: 'size', values: ['20'] },
        page: { key: 'page', values: ['0'] },
      })
    })
  })
  it('will allow paging through results while maintain the filter', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 101, size: 20 })
    searchWithFilter.filterAll({
      user: 'Andy',
      statusText: 'Active',
      caseloadText: 'Moorland',
      roleText: 'User Admin',
    })

    searchWithFilter.rows().should('have.length', 20)
    searchWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 20 of 101 results')

    searchWithFilter.paginationLink('5').click()
    searchWithFilter.filterWithTag('Andy').should('exist')
    searchWithFilter.filterWithTag('Active').should('exist')
    searchWithFilter.filterWithTag('Moorland').should('exist')
    searchWithFilter.filterWithTag('User Admin').should('exist')

    cy.task('verifyDpsFindUsers').should((requests) => {
      expect(requests).to.have.lengthOf(3)

      expect(requests[2].queryParams).to.deep.equal({
        nameFilter: { key: 'nameFilter', values: ['Andy'] },
        accessRoles: { key: 'accessRoles', values: ['USER_ADMIN'] },
        status: { key: 'status', values: ['ACTIVE'] },
        caseload: { key: 'caseload', values: ['MDI'] },
        activeCaseload: { key: 'activeCaseload', values: ['MDI'] },
        size: { key: 'size', values: ['20'] },
        page: { key: 'page', values: ['4'] },
      })
    })
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
    // A workaround for https://github.com/cypress-io/cypress/issues/14857
    let csv
    cy.intercept('GET', '*/user-download*', (req) => {
      req.reply((res) => {
        csv = res.body
        res.headers.location = '/'
        res.send(302)
      })
    }).as('csvDownload')

    const results = goToSearchWithFilterPage({})

    results.download().click()
    cy.wait('@csvDownload').then(() => {
      parse(csv, {}, (err, output) => {
        validateCsv(output)
      })
    })
  })
  it('Hide download link and show restriction message', () => {
    const searchWithFilter = goToSearchWithFilterPage({ totalElements: 2000000 })
    searchWithFilter
      .getHideDownloadLinkMessage()
      .should(
        'contain.text',
        'More than 20000 results returned, please refine your search if you want to download the results',
      )
  })

  it('When non-admin is logged in, should not show download link and  download restriction message', () => {
    const searchWithFilter = goToSearchWithFilterPage({ isAdmin: false, totalElements: 2000000 })
    searchWithFilter
      .getHideDownloadLinkMessage()
      .should(
        'not.exist',
        'More than 20000 results returned, please refine your search if you want to download the results',
      )
    searchWithFilter.getDownloadLinkMessage().should('not.exist', 'Download results')
  })
})
