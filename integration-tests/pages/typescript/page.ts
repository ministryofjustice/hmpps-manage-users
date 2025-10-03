export type PageElement = Cypress.Chainable<JQuery>

// This should be moved to the top level when we move to typescript
export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  protected constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')
  
  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')
}