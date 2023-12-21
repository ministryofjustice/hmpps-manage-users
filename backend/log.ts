const Logger = require('bunyan')

module.exports = new Logger({
  name: 'hmpps-manage-users',
  streams: [
    {
      stream: process.stdout,
      level: 'debug',
    },
  ],
})
