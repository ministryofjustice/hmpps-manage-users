const express = require('express')
const { logError } = require('./logError')

const menuRouter = require('./routes/menuRouter')
const manageAuthUserRouter = require('./routes/manageAuthUserRouter')
const searchExternalUserRouter = require('./routes/searchExternalUserRouter')
const searchDpsUserRouter = require('./routes/searchDpsUserRouter')
const createAuthUserRouter = require('./routes/createAuthUserRouter')
const manageDpsUserRouter = require('./routes/manageDpsUserRouter')
const manageGroupsRouter = require('./routes/manageGroupsRouter')
const currentUser = require('./middleware/currentUser')

const configureRoutes = ({ oauthApi, prisonApi }) => {
  const router = express.Router()

  router.use(currentUser({ prisonApi, oauthApi }))

  router.use('/', menuRouter({ logError }))
  router.use('/create-external-user', createAuthUserRouter({ oauthApi, logError }))
  router.use('/search-external-users', searchExternalUserRouter({ oauthApi, logError }))
  router.use('/search-dps-users', searchDpsUserRouter({ prisonApi, logError }))
  router.use('/manage-external-users/:username', manageAuthUserRouter({ oauthApi, logError }))
  router.use('/manage-dps-users/:username', manageDpsUserRouter({ prisonApi, logError }))
  router.use('/manage-groups', manageGroupsRouter({ oauthApi, logError }))

  return router
}

module.exports = configureRoutes
