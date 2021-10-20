const page = require('./page')

const applyFilters = () => cy.get('button').contains('Apply filters')
const roleNameFilterInput = () => cy.get('[id="roleName"]')
const roleCodeFilterInput = () => cy.get('[id="roleCode"]')
const filterWithTag = (tag) => cy.get('a').contains(tag)
const adminTypeFilterRadioButton = (text) => cy.contains('label', text).prev()

const rolesPage = () =>
  page('Manage roles', {
    filter: () => cy.get('[class="moj-filter"]'),
    filterRoleName: (text) => {
      if (text) roleNameFilterInput().type(text)
      else roleNameFilterInput().clear()
      applyFilters().click()
      return rolesPage()
    },
    filterRoleCode: (text) => {
      if (text) roleCodeFilterInput().type(text)
      else roleCodeFilterInput().clear()
      applyFilters().click()
      return rolesPage()
    },
    filterWithTag,
    roleNameFilterInput,
    roleCodeFilterInput,
    adminTypeFilterRadioButton,
    filterAdminType: (text) => {
      adminTypeFilterRadioButton(text).click()
      applyFilters().click()
    },
    filterAll: ({ roleName, roleCode, adminType }) => {
      roleNameFilterInput().type(roleName)
      roleCodeFilterInput().type(roleCode)
      adminTypeFilterRadioButton(adminType).click()
      applyFilters().click()
    },
    manageLinkForRole: (roleCode) => cy.get(`a[data-qa="edit-button-${roleCode}"]`),
    rows: () => cy.get('[data-qa="roles"] tbody tr'),
    nextPage: () => cy.get('.moj-pagination__item--next').first().click(),
    previousPage: () => cy.get('.moj-pagination__item--prev').first().click(),
    getPaginationResults: () => cy.get('.moj-pagination__results'),
    paginationLink: (pageNumber) => cy.get('a').contains(pageNumber),
  })

export default {
  verifyOnPage: rolesPage,
  goTo: () => {
    cy.visit('/manage-roles')
    return rolesPage()
  },
}
