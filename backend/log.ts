import * as bunyan from 'bunyan'

const log = bunyan.createLogger({
  name: 'hmpps-manage-users',
  streams: [
    {
      level: 'info',
      stream: process.stdout,
    },
  ],
})

export default log
