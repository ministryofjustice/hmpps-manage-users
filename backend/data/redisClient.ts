import { createClient } from 'redis'
import logger from '../log'
import config from '../config'

export type RedisClient = ReturnType<typeof createClient>

export const createRedisClient = (): RedisClient => {
  const { host, port, password } = config.redis
  if (!host) return null

  const url = config.app.production ? `rediss://${host}:${port}` : `redis://${host}:${port}`
  const legacyMode = true

  const client = createClient({
    url,
    password,
    legacyMode,
    socket: {
      reconnectStrategy: (attempts: number) => {
        // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
        const nextDelay = Math.min(2 ** attempts * 20, 30000)
        logger.info(`Retry Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms`)
        return nextDelay
      },
    },
  })

  client.on('error', (e: Error) => logger.error('Redis client error', e))
  return client
}
