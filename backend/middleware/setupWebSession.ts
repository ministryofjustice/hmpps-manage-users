import session from 'express-session'
import connectRedis, { Client } from 'connect-redis'
import express, { Router } from 'express'
import config from '../config'
import logger from '../log'
import { createRedisClient } from '../data/redisClient'

const RedisStore = connectRedis(session)

export default function setupWebSession(): Router {
  const getSessionStore = () => {
    const client = createRedisClient({ legacyMode: true })
    if (client != null) {
      client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))
      return new RedisStore({ client: client as unknown as Client })
    }

    return null
  }

  const router = express.Router()
  router.use(
    session({
      store: getSessionStore(),
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
