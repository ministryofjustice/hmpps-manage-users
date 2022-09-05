const express = require('express')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const logger = require('../log')
const redisClientFactory = require('../data/redisClient')

const config = require('../config')

const router = express.Router()

module.exports = () => {
  const getSessionStore = () => {
    const client = redisClientFactory.createRedisClient()
    client.connect().catch((err) => logger.error(`Error connecting to Redis`, err))
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
