import Logger from 'bunyan'

const logger: Logger = new Logger({
  name: 'hmpps-manage-users',
  streams: [
    {
      stream: process.stdout,
      level: 'debug',
    },
  ],
})

export default logger
