import { defineConfig } from 'cypress'

export default defineConfig({
  chromeWebSecurity: false,
  fixturesFolder: 'integration-tests/fixtures',
  screenshotsFolder: 'integration-tests/screenshots',
  videosFolder: 'integration-tests/videos',
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    configFile: 'cypress-reporter-config.json',
  },
  videoUploadOnPasses: false,
  taskTimeout: 60000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line import/no-unresolved,global-require,@typescript-eslint/no-var-requires
      return require('./integration-tests/plugins/index.js')(on, config)
    },
    baseUrl: 'http://localhost:3008',
    excludeSpecPattern: '**/!(*.cy).js',
    specPattern: 'integration-tests/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'integration-tests/support/e2e.js',
  },
})
