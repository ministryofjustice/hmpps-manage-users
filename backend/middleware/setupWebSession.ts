import session from 'express-session'
import connectRedis, { Client } from 'connect-redis'
import express, { Router } from 'express'
import config from '../../server/config'
import logger from '../log'
import { createRedisClient } from '../data/redisClient'

const RedisStore = connectRedis(session)

export default function setupWebSession(): Router {
  const getSessionStore = () => {
    const client = createRedisClient()
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
      cookie: { secure: config.https, sameSite: 'lax', maxAge: config.session.expiryMinutes * 60 * 1000 },
      secret: config.session.secret,
      resave: false, // redis implements touch so shouldn't need this
      saveUninitialized: false,
      rolling: true,
    }),
  )
  return router
}
