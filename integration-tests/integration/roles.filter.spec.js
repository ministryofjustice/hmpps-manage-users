const roleDetailsPage = require('../pages/roleDetailsPage')
const { goToMainMenuPage, goToViewRoleWithFilterPage } = require('../support/roles.helpers')

context('Roles', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show menu option for search page', () => {
    const menu = goToMainMenuPage({})
    menu.viewRoles().should('exist')
  })

  it('Should show filter', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({})
    rolesWithFilter.filter().should('exist')
  })

  it('can add and remove role name  filter', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({})

    rolesWithFilter.filterRoleName('general')
    rolesWithFilter.filterWithTag('general').should('exist')
    rolesWithFilter.roleNameFilterInput().should('have.value', 'general')

    rolesWithFilter.filterWithTag('general').click()
    rolesWithFilter.filterWithTag('general').should('not.exist')
    rolesWithFilter.roleNameFilterInput().should('have.value', '')
  })

  it('can add and remove role code filter', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({})

    rolesWithFilter.filterRoleCode('GEN')
    rolesWithFilter.filterWithTag('GEN').should('exist')
    rolesWithFilter.roleCodeFilterInput().should('have.value', 'GEN')

    rolesWithFilter.filterWithTag('GEN').click()
    rolesWithFilter.filterWithTag('GEN').should('not.exist')
    rolesWithFilter.roleCodeFilterInput().should('have.value', '')
  })

  it('can change default ALL adminType to EXT_ADM, DPS_ADM or DPS_LSA only', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({})
    rolesWithFilter.adminTypeFilterRadioButton('All').should('be.checked')

    rolesWithFilter.filterAdminType('EXT ADMIN')
    rolesWithFilter.adminTypeFilterRadioButton('EXT ADMIN').should('be.checked')
    rolesWithFilter.filterWithTag('EXT_ADM').should('exist')

    rolesWithFilter.filterAdminType('DPS ADMIN')
    rolesWithFilter.adminTypeFilterRadioButton('DPS ADMIN').should('be.checked')
    rolesWithFilter.filterWithTag('DPS_ADM').should('exist')

    rolesWithFilter.filterAdminType('DPS LSA')
    rolesWithFilter.adminTypeFilterRadioButton('DPS LSA').should('be.checked')
    rolesWithFilter.filterWithTag('DPS_LSA').should('exist')

    rolesWithFilter.filterAdminType('All')
    rolesWithFilter.adminTypeFilterRadioButton('All').should('be.checked')
    rolesWithFilter.filterWithTag('All').should('not.exist')
  })

  const toRole = ($cell) => ({
    role: $cell[0]?.textContent.replace(/\s+/g, ' ').trim(),
  })

  it('will shows result before and after filtering', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({ totalElements: 5 })
    rolesWithFilter.rows().should('have.length', 5)

    cy.get('[data-qa="roles"]').then(($table) => {
      cy.get($table)
        .find('tr')
        .then(($tableRows) => {
          cy.get($tableRows).its('length').should('eq', 5)

          const role = Array.from($tableRows).map(($row) => toRole($row.cells))

          expect(role[0].role).to.eq('Role Name 0 rolecode0 DPS ADMIN DPS LSA')
          expect(role[1].role).to.eq('Role Name 1 rolecode1 DPS ADMIN DPS LSA')
          expect(role[2].role).to.eq('Role Name 2 rolecode2 DPS ADMIN DPS LSA')
          expect(role[3].role).to.eq('Role Name 3 rolecode3 DPS ADMIN DPS LSA')
          expect(role[4].role).to.eq('Role Name 4 rolecode4 DPS ADMIN DPS LSA')
        })
    })
    rolesWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 5 results')

    cy.task('stubAllRoles', { totalElements: 3 })
    rolesWithFilter.filterAdminType('DPS ADMIN')
    rolesWithFilter.rows().should('have.length', 3)
    rolesWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 3 of 3 results')
  })

  it('will have a link to maintain the role', () => {
    cy.task('stubRoleDetails', {})

    const rolesWithFilter = goToViewRoleWithFilterPage({ totalElements: 5 })
    rolesWithFilter.manageLinkForRole('Role Name 0').click()
    roleDetailsPage.verifyOnPage('Auth Group Manager')
  })

  it('will call the find roles api when admin is logged in and has filter', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({ isAdmin: true, totalElements: 29 })
    rolesWithFilter.filterAll({
      roleName: 'General',
      roleCode: 'GEN',
      adminType: 'DPS ADMIN',
    })
    rolesWithFilter.filterWithTag('General').should('exist')
    rolesWithFilter.filterWithTag('GEN').should('exist')
    rolesWithFilter.filterWithTag('DPS_ADM').should('exist')

    cy.task('verifyAllRoles').should((requests) => {
      expect(requests).to.have.lengthOf(2)

      expect(requests[1].queryParams).to.deep.equal({
        roleName: { key: 'roleName', values: ['General'] },
        roleCode: { key: 'roleCode', values: ['GEN'] },
        adminTypes: { key: 'adminTypes', values: ['DPS_ADM'] },
        page: { key: 'page', values: ['0'] },
        size: { key: 'size', values: ['20'] },
      })
    })
  })

  it('will allow paging through results while maintain the filter', () => {
    const rolesWithFilter = goToViewRoleWithFilterPage({ totalElements: 101, size: 5 })
    rolesWithFilter.filterAll({
      roleName: 'General',
      roleCode: 'GEN',
      adminType: 'DPS ADMIN',
    })

    rolesWithFilter.rows().should('have.length', 5)
    rolesWithFilter.getPaginationResults().should('contain.text', 'Showing 1 to 5 of 101 results')

    rolesWithFilter.paginationLink('5').click()
    rolesWithFilter.filterWithTag('General').should('exist')
    rolesWithFilter.filterWithTag('GEN').should('exist')
    rolesWithFilter.filterWithTag('DPS_ADM').should('exist')

    cy.task('verifyAllRoles').should((requests) => {
      expect(requests).to.have.lengthOf(3)

      expect(requests[2].queryParams).to.deep.equal({
        roleName: { key: 'roleName', values: ['General'] },
        roleCode: { key: 'roleCode', values: ['GEN'] },
        adminTypes: { key: 'adminTypes', values: ['DPS_ADM'] },
        page: { key: 'page', values: ['4'] },
        size: { key: 'size', values: ['20'] },
      })
    })
  })
})
