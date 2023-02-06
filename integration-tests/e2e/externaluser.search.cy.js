import { parse } from 'csv-parse'
import { goToMainMenuPage } from '../support/externaluser.helpers'
import MenuPage from '../pages/menuPage'
import ExternalUserSearchPage from '../pages/authUserSearchPage'

const { searchForUser, replicateUser } = require('../support/externaluser.helpers')

context('External user search functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  describe('search for a user', () => {
    it('Should show menu option for search page', () => {
      const menu = goToMainMenuPage()
      menu.searchExternalUsersLink().should('exist')
    })

    it('Should show filter', () => {
      const search = searchForUser()
      search.filter().should('exist')
    })

    it('can add and remove user filter', () => {
      const search = searchForUser()

      search.filterUser('Andy')
      search.filterWithTag('Andy').should('exist')
      search.userFilterInput().should('have.value', 'Andy')

      search.filterWithTag('Andy').click()
      search.filterWithTag('Andy').should('not.exist')
      search.userFilterInput().should('have.value', '')
    })

    it('Should display a message if no search results', () => {
      const search = searchForUser('MAINTAIN_OAUTH_USERS', [])
      search.noResults().should('contain.text', 'No records found')
    })

    it('Should still show the filters if no search results', () => {
      const search = searchForUser('MAINTAIN_OAUTH_USERS', [])

      search.noResults().should('contain.text', 'No records found')
      search.statusFilterRadioButton('All').should('be.checked')
      search.userFilterInput().should('exist')
      search.groupFilterSelect().should('exist')
      search.roleFilterSelect().should('exist')
    })

    it('can change default ALL status to active or inactive only', () => {
      const search = searchForUser()
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

    it('will show user details in the results', () => {
      const search = searchForUser()
      search.rows().should('have.length', 1)
      search.rows().eq(0).should('include.text', 'Auth\u00a0Adm')
      search.rows().eq(0).should('include.text', 'AUTH_ADM')
      search.rows().eq(0).should('include.text', 'Active')
      search.rows().eq(1).should('not.exist')
      search.rows().eq(2).should('not.exist')
    })

    it('will trim the username entered', () => {
      const search = searchForUser()

      search.filterUser(' Andy ')
      search.filterWithTag('Andy').should('exist')
      search.userFilterInput().should('have.value', 'Andy')
    })

    it('Should escape html tags in user names when displaying results', () => {
      const search = searchForUser('MAINTAIN_OAUTH_USERS', [
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

      search.rows().eq(0).should('not.include.text', 'XSSAttack')
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
      const results = searchForUser()
      results.filterGroup('SOCU North West')

      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(2)

        expect(requests[0].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: [''] },
          roles: { key: 'roles', values: [''] },
          size: { key: 'size', values: ['20'] },
          status: { key: 'status', values: ['ALL'] },
        })

        expect(requests[1].queryParams).to.deep.equal({
          groups: { key: 'groups', values: ['SOC_NORTH_WEST'] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: [''] },
          roles: { key: 'roles', values: [''] },
          size: { key: 'size', values: ['20'] },
          status: { key: 'status', values: ['ALL'] },
        })
      })
    })

    it('Should allow a user search by role and display results', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()
      cy.task('stubAssignableGroups', {})
      cy.task('stubExtSearchableRoles', {})
      cy.task('stubAuthSearch', {
        content: replicateUser(1),
        totalElements: 1,
        page: 0,
        size: 1,
      })

      menuPage.searchExternalUsers()
      const searchByGroup = ExternalUserSearchPage.verifyOnPage()
      searchByGroup.filterRole('Global Search')

      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(2)

        expect(requests[1].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: [''] },
          roles: { key: 'roles', values: ['GLOBAL_SEARCH'] },
          status: { key: 'status', values: ['ALL'] },
          size: { key: 'size', values: ['20'] },
        })
      })
    })

    it('will allow paging through results while maintain the filter', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()
      cy.task('stubAssignableGroups', {})
      cy.task('stubExtSearchableRoles', {})
      cy.task('stubAuthSearch', {
        content: replicateUser(20),
        totalElements: 101,
        page: 0,
        size: 20,
      })

      menuPage.searchExternalUsers()
      const search = ExternalUserSearchPage.verifyOnPage()

      search.filterAll({
        user: 'Andy',
        statusText: 'Active',
        groupText: 'PECS Court Southend Combined Court',
        roleText: 'Licence Vary',
      })

      search.rows().should('have.length', 20)
      search.getPaginationResults().should('contain.text', 'Showing 1 to 20 of 101 results')

      search.paginationLink('5').click()
      search.filterWithTag('Andy').should('exist')
      search.filterWithTag('Active').should('exist')
      search.filterWithTag('PECS Court Southend Combined Court').should('exist')
      search.filterWithTag('Licence Vary').should('exist')

      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(3)

        expect(requests[2].queryParams).to.deep.equal({
          groups: { key: 'groups', values: ['PECS_SOUTBC'] },
          name: { key: 'name', values: ['Andy'] },
          page: { key: 'page', values: ['4'] },
          roles: { key: 'roles', values: ['LICENCE_VARY'] },
          size: { key: 'size', values: ['20'] },
          status: { key: 'status', values: ['ACTIVE'] },
        })
      })
    })

    it('Should move between paged result when next page and previous page selected', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }] })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()
      cy.task('stubAssignableGroups', {})
      cy.task('stubExtSearchableRoles', {})
      cy.task('stubAuthSearch', {
        content: replicateUser(5),
        totalElements: 21,
        page: 1,
        size: 5,
      })

      menuPage.searchExternalUsers()
      const search = ExternalUserSearchPage.verifyOnPage()
      search.rows().should('have.length', 5)

      search.getPaginationResults().should('contain.text', 'Showing 6 to 10 of 21 results')
      search.nextPage()
      search.previousPage()
      cy.task('verifyAuthSearch').should((requests) => {
        expect(requests).to.have.lengthOf(3)

        expect(requests[0].queryParams).to.deep.equal({
          groups: { key: 'groups', values: [''] },
          name: { key: 'name', values: [''] },
          page: { key: 'page', values: [''] },
          roles: { key: 'roles', values: [''] },
          size: { key: 'size', values: ['20'] },
          status: { key: 'status', values: ['ALL'] },
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
      const menuPage = MenuPage.verifyOnPage()
      cy.task('stubAssignableGroups', {})
      cy.task('stubExtSearchableRoles', {})
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
      menuPage.searchExternalUsers()
      const search = ExternalUserSearchPage.verifyOnPage()
      //  search.rows().should('have.length', 5)

      search.download().click()
      cy.wait('@csvDownload').then(() => {
        parse(csv, {}, (err, output) => {
          validateCsv(output)
        })
      })
      // attempt to ensure with go any other page except '/' which is where we go after
      // csv download - else next test fail to signin since we are already at '/'
      ExternalUserSearchPage.goTo()
    })

    it('Should not show the download link for group managers', () => {
      cy.task('stubSignIn', { roles: [{ roleCode: 'MAINTAIN_OAUTH_USERS' }, { roleCode: 'AUTH_GROUP_MANAGER' }] })
      cy.signIn()
      const menuPage = MenuPage.verifyOnPage()
      cy.task('stubAssignableGroups', {})
      cy.task('stubExtSearchableRoles', {})

      cy.task('stubAuthSearch', {
        content: replicateUser(5),
        totalElements: 21,
        page: 0,
        size: 5,
      })

      // const search = ExternalUserSearchPage.goTo()
      // search('sometext@somewhere.com')
      // const results = UserSearchResultsPage.verifyOnPage()
      menuPage.searchExternalUsers()
      const search = ExternalUserSearchPage.verifyOnPage()
      search.download().should('not.exist')
    })
  })
})
