const Logger = require('bunyan')

module.exports = new Logger({
  name: 'manage-hmpps-auth-accounts',
  streams: [
    {
      stream: process.stdout,
      level: 'debug',
    },
  ],
})
