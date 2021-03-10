const express = require('express')

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

  router.use('/', menuRouter())
  router.use('/create-external-user', createAuthUserRouter({ oauthApi }))
  router.use('/search-external-users', searchExternalUserRouter({ oauthApi }))
  router.use('/search-dps-users', searchDpsUserRouter({ prisonApi }))
  router.use('/manage-external-users/:username', manageAuthUserRouter({ oauthApi }))
  router.use('/manage-dps-users/:username', manageDpsUserRouter({ prisonApi, oauthApi }))
  router.use('/manage-groups', manageGroupsRouter({ oauthApi }))

  return router
}

module.exports = configureRoutes
