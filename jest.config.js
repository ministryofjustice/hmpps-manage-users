module.exports = {
  collectCoverageFrom: ['src/**/*.{js,jsx,mjs}', 'backend/**/*.{js,jsx,mjs}'],
  setupFiles: ['<rootDir>/config/polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/config/jest/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,mjs}',
    '<rootDir>/(src|backend)/**/?(*.)(spec|test).{js,jsx,mjs}',
  ],
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  transform: {
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\](?!(new-nomis-shared-components|spin.js)/).+\\.(js|jsx|mjs)$'],
  moduleFileExtensions: ['web.js', 'js', 'json', 'web.jsx', 'jsx', 'node', 'mjs'],
}
