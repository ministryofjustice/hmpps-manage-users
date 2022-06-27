import { parse } from 'csv-parse'

const { goToSearchPage, goToMainMenuPage } = require('../support/dpsuser.helpers')
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
    menu.searchDpsUsers().should('exist')
  })

  it('Should show filter', () => {
    const search = goToSearchPage({})
    search.filter().should('exist')
  })

  it('can add and remove user filter', () => {
    const search = goToSearchPage({})

    search.filterUser('Andy')
    search.filterWithTag('Andy').should('exist')
    search.userFilterInput().should('have.value', 'Andy')

    search.filterWithTag('Andy').click()
    search.filterWithTag('Andy').should('not.exist')
    search.userFilterInput().should('have.value', '')
  })

  it('can change default ALL status to active or inactive only', () => {
    const search = goToSearchPage({})
    search.statusFilterRadioButton('All').should('be.checked')

    search.filterStatus('Inactive')
    search.statusFilterRadioButton('Inactive').should('be.checked')
    search.filterWithTag('Inactive').should('exist')

    search.filterStatus('Active')
    search.statusFilterRadioButton('Active').should('be.checked')
    search.filterWithTag('Active').should('exist')

    search.filterStatus('All')
    search.statusFilterRadioButton('All').should('be.checked')
    search.filterWithTag('All').should('not.exist')
  })

  it('can add and remove a single caseload filter', () => {
    const search = goToSearchPage({})

    search.filterCaseload('Moorland')
    search.filterWithTag('Moorland').should('exist')
    search.filterWithTag('Active caseload only').should('exist')
    search.activeCaseloadFilterRadioButton('Yes').should('be.checked')

    search.filterWithTag('Active caseload only').click()
    search.filterWithTag('Active caseload only').should('not.exist')
    search.activeCaseloadFilterRadioButton('Yes').should('not.be.checked')

    search.filterWithTag('Moorland').click()
    search.filterWithTag('Moorland').should('not.exist')
    search.activeCaseloadFilterRadioButton('Yes').should('be.checked')
  })
  it('can not see caseload filter when not an admin', () => {
    const search = goToSearchPage({ isAdmin: false })

    search.caseload().should('not.exist')
  })
  it('can add and remove a single role filter', () => {
    const search = goToSearchPage({})

    search.filterRole('User Admin')
    search.filterWithTag('User Admin').should('exist')

    search.filterWithTag('User Admin').click()
    search.filterWithTag('User Admin').should('not.exist')
  })
  it('can search for a role to filter', () => {
    const search = goToSearchPage({})

    search.role('Maintain Roles').should('be.visible')
    search.role('User Admin').should('be.visible')
    search.role('User General').should('be.visible')

    search.searchForRole('User')
    search.role('Maintain Roles').should('not.be.visible')
    search.role('User Admin').should('be.visible')
    search.role('User General').should('be.visible')

    search.searchForRole('Maintain')
    search.role('Maintain Roles').should('be.visible')
    search.role('User Admin').should('not.be.visible')
    search.role('User General').should('not.be.visible')

    search.searchForRole('')
    search.role('Maintain Roles').should('be.visible')
    search.role('User Admin').should('be.visible')
    search.role('User General').should('be.visible')
  })
  it('will shows result before and after filtering', () => {
    const search = goToSearchPage({ totalElements: 5 })
    search.rows().should('have.length', 5)
    search.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    search.rows().eq(1).should('include.text', 'Itag\u00a0User1')
    search.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')

    cy.task('stubDpsFindUsers', { totalElements: 3 })
    search.filterCaseload('Moorland')
    search.rows().should('have.length', 3)
    search.getPaginationResults().should('contain.text', 'Showing 1 to 3 of 3 results')
  })
  it('will show user details in the results', () => {
    const search = goToSearchPage({ totalElements: 3 })
    search.rows().should('have.length', 3)
    search.rows().eq(0).should('include.text', 'Itag\u00a0User0')
    search.rows().eq(0).should('include.text', 'ITAG_USER0@gov.uk')
    search.rows().eq(0).should('include.text', 'Active')
    search.rows().eq(0).should('include.text', 'Brixton (HMP)')
    search.rows().eq(0).should('include.text', 'No DPS roles')
    search.rows().eq(1).should('include.text', '1 DPS role')
    search.rows().eq(2).should('include.text', '2 DPS roles')
  })
  it('will have a link to maintain the user', () => {
    cy.task('stubDpsUserDetails', {})
    cy.task('stubDpsUserGetRoles')
    cy.task('stubEmail', { email: 'ITAG_USER@gov.uk', verified: true })
    const search = goToSearchPage({ totalElements: 5 })
    search.manageLinkForUser('ITAG_USER0').click()
    UserPage.verifyOnPage('Itag User')
  })
  it('will call the find users api when admin is logged in and no filter', () => {
    goToSearchPage({ isAdmin: true, totalElements: 29 })
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
        inclusiveRoles: { key: 'inclusiveRoles', values: [''] },
        showOnlyLSAs: { key: 'showOnlyLSAs', values: [''] },
      })
    })
  })
  it('will call the find users api when admin is logged in and has filter', () => {
    const search = goToSearchPage({ isAdmin: true, totalElements: 29 })
    search.filterAll({
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
        inclusiveRoles: { key: 'inclusiveRoles', values: [''] },
        showOnlyLSAs: { key: 'showOnlyLSAs', values: [''] },
      })
    })
  })
  it('will call the find users api when non-admin is logged in and no filter', () => {
    goToSearchPage({ isAdmin: false, totalElements: 29 })
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
        inclusiveRoles: { key: 'inclusiveRoles', values: [''] },
        showOnlyLSAs: { key: 'showOnlyLSAs', values: [''] },
      })
    })
  })
  it('will call the find users api when non-admin is logged in with filter', () => {
    const search = goToSearchPage({ isAdmin: false, totalElements: 29 })
    search.filterAllNonAdmin({
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
        inclusiveRoles: { key: 'inclusiveRoles', values: [''] },
        showOnlyLSAs: { key: 'showOnlyLSAs', values: [''] },
      })
    })
  })
  it('will allow paging through results while maintain the filter', () => {
    const search = goToSearchPage({ totalElements: 101, size: 20 })
    search.filterAll({
      user: 'Andy',
      statusText: 'Active',
      caseloadText: 'Moorland',
      roleText: 'User Admin',
    })

    search.rows().should('have.length', 20)
    search.getPaginationResults().should('contain.text', 'Showing 1 to 20 of 101 results')

    search.paginationLink('5').click()
    search.filterWithTag('Andy').should('exist')
    search.filterWithTag('Active').should('exist')
    search.filterWithTag('Moorland').should('exist')
    search.filterWithTag('User Admin').should('exist')

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
        inclusiveRoles: { key: 'inclusiveRoles', values: [''] },
        showOnlyLSAs: { key: 'showOnlyLSAs', values: [''] },
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

    const results = goToSearchPage({})

    results.download().click()
    cy.wait('@csvDownload').then(() => {
      parse(csv, {}, (err, output) => {
        validateCsv(output)
      })
    })
  })
  it('Hide download link and show restriction message', () => {
    const search = goToSearchPage({ totalElements: 2000000 })
    search
      .getHideDownloadLinkMessage()
      .should(
        'contain.text',
        'More than 20000 results returned, please refine your search if you want to download the results',
      )
  })

  it('When non-admin is logged in, should not show download link and  download restriction message', () => {
    const search = goToSearchPage({ isAdmin: false, totalElements: 2000000 })
    search
      .getHideDownloadLinkMessage()
      .should(
        'not.exist',
        'More than 20000 results returned, please refine your search if you want to download the results',
      )
    search.getDownloadLinkMessage().should('not.exist', 'Download results')
  })
})
