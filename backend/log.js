// Note: Keep this file as js to avoid issues with bunyan-middleware
// Use ../logger.ts for typescript files

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
