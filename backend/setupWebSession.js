const express = require('express')
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const logger = require('./log')

const config = require('../server/config').default

const router = express.Router()

module.exports = () => {
  const getSessionStore = () => {
    const { host, port, password } = config.redis
    if (!host) return null

    const url = config.production ? `rediss://${host}:${port}` : `redis://${host}:${port}`
    const legacyMode = true

    const client = redis.createClient({
      url,
      password,
      legacyMode,
      socket: {
        reconnectStrategy: (attempts) => {
          // Exponential back off: 20ms, 40ms, 80ms..., capped to retry every 30 seconds
          const nextDelay = Math.min(2 ** attempts * 20, 30000)
          logger.info(`Retry Redis connection attempt: ${attempts}, next attempt in: ${nextDelay}ms`)
          return nextDelay
        },
      },
    })

    client.on('error', (e) => logger.error('Redis client error', e))
    client.connect().catch((err) => logger.error(`Error connecting to Redis`, err))
    return new RedisStore({ client })
  }

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
