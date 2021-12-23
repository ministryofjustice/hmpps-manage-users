import './commands'
import 'cypress-axe'

// There seem to be some uncaught exceptions in Gov UK
Cypress.on(
  'uncaught:exception',
  (err) =>
    // returning false here prevents Cypress from failing the test
    false,
)
