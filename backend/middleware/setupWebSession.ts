import session, { MemoryStore, Store } from 'express-session'
import { RedisStore } from 'connect-redis'
import express, { Router } from 'express'
import config from '../config'
import logger from '../log'
import { createRedisClient } from '../data/redisClient'

export default function setupWebSession(): Router {
  let store: Store
  if (config.redis.enabled) {
    const client = createRedisClient()
    client.connect().catch((err: Error) => logger.error(`Error connecting to Redis`, err))
    store = new RedisStore({ client })
  } else {
    store = new MemoryStore()
  }

  const router = express.Router()
  router.use(
    session({
      store,
      secret: [config.session.secret],
      resave: false,
      saveUninitialized: false,
      rolling: true,
      name: config.hmppsCookie.name,
      cookie: {
        domain: config.hmppsCookie.domain,
        httpOnly: true,
        maxAge: config.session.expiryMinutes * 60 * 1000,
        sameSite: 'lax',
        secure: config.app.production,
        signed: true,
      },
    }),
  )
  return router
}
