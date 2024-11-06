import bunyan from 'bunyan'
import bunyanFormat from 'bunyan-format'

const formatOut = bunyanFormat({ outputMode: 'short', color: true })

const logger = bunyan.createLogger({
  name: 'Manage Users UI',
  stream: formatOut,
  level: 'debug',
  serializers: bunyan.stdSerializers,
})

export default logger
