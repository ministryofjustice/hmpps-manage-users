const express = require('express')
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const logger = require('./log')

const config = require('./config')

const router = express.Router()

module.exports = () => {
  const getSessionStore = () => {
    const { host, port, password } = config.redis
    if (!host) return null

    const url = config.app.production ? `rediss://${host}:${port}` : `redis://${host}:${port}`
    const legacyModeOn = true

    const client = redis.createClient({
      url,
      password,
      legacyModeOn,
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
    return new RedisStore({ client })
  }

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
