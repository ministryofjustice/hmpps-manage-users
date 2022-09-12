const MenuPage = require('../pages/menuPage')
const DpsUserSelectCreatePage = require('../pages/dpsSelectUserCreatePage')
const DpsUserCreatePage = require('../pages/dpsUserCreatePage')

function goToSelectUserType() {
  cy.task('stubSignIn', { roles: [{ roleCode: 'CREATE_USER' }], tokenRoles: 'ROLE_CREATE_USER' })
  cy.signIn()
  const menuPage = MenuPage.verifyOnPage()

  menuPage.createDpsUser()

  return DpsUserSelectCreatePage.verifyOnPage()
}

context('Select DPS user to create functionality', () => {
  before(() => {
    cy.clearCookies()
  })

  beforeEach(() => {
    cy.task('reset')
  })

  it('Should show all available user types', () => {
    const createPage = goToSelectUserType()
    createPage.allRadios().should('have.length', 3)
    createPage.userTypeRadioButton('Central Admin').should('not.be.checked')
    createPage.userTypeRadioButton('General User').should('not.be.checked')
    createPage.userTypeRadioButton('Local System Administrator (LSA)').should('not.be.checked')
  })

  it('Should show error if nothing selected', () => {
    const createPage = goToSelectUserType()
    createPage.submit().click()

    const createPageAfterSubmit = DpsUserSelectCreatePage.verifyOnPage()
    createPageAfterSubmit.errorSummary().should('contain.text', 'Select a user type')
  })

  it('Should successfully move to create DPS user page if user type selected', () => {
    cy.task('stubDpsGetCaseloads')

    const createPage = goToSelectUserType()
    createPage.userTypeRadioButton('Central Admin').click()
    createPage.submit().click()

    DpsUserCreatePage.verifyOnPage('Create a DPS Central Admin user')
  })

  it('Should check for CSRF token', () => {
    cy.task('stubDpsGetCaseloads')

    goToSelectUserType()

    // Attempt to submit form without CSRF token:
    cy.request({
      method: 'POST',
      url: 'create-user',
      body: {},
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.be.equal(500)
    })
  })
})
