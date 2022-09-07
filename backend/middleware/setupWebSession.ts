import { createClient } from 'redis'
import session from 'express-session'
import connectRedis, { Client } from 'connect-redis'
import express, { Router } from 'express'
import config from '../config'
import logger from '../log'

const RedisStore = connectRedis(session)

export default function setupWebSession(): Router {
  const { host, port, password } = config.redis

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
  client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))

  const router = express.Router()
  router.use(
    session({
      store: new RedisStore({ client: client as unknown as Client }),
      secret: [config.hmppsCookie.sessionSecret],
      resave: false,
      saveUninitialized: false,
      rolling: true,
      name: config.hmppsCookie.name,
      cookie: {
        domain: config.hmppsCookie.domain,
        httpOnly: true,
        maxAge: config.hmppsCookie.expiryMinutes * 60 * 1000,
        sameSite: 'lax',
        secure: config.app.production,
        signed: true,
      },
    }),
  )
  return router
}
