// const Logger = require('bunyan')
//
// module.exports = new Logger({
//   name: 'hmpps-manage-users',
//   streams: [
//     {
//       stream: process.stdout,
//       level: 'debug',
//     },
//   ],
// })

import * as bunyan from 'bunyan';

const log = bunyan.createLogger({
  name: 'hmpps-manage-users',
  streams: [
    {
      level: 'info',
      stream: process.stdout,
    },
  ],
});

export default log;