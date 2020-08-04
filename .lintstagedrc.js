const { CLIEngine } = require('eslint')

const cli = new CLIEngine({})

module.exports = {
  '*.{js,json,css}': [
    'prettier --write',
    (files) => 'eslint --fix --max-warnings=0 ' + files.filter((file) => !cli.isPathIgnored(file)).join(' '),
  ],
}
