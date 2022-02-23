const express = require('express')

const menuRouter = require('./routes/menuRouter')
const manageAuthUserRouter = require('./routes/manageAuthUserRouter')
const searchExternalUserRouter = require('./routes/searchExternalUserRouter')
const searchDpsUserRouter = require('./routes/searchDpsUserRouter')
const searchWithFilterDpsUserRouter = require('./routes/searchWithFilterDpsUserRouter')
const createAuthUserRouter = require('./routes/createAuthUserRouter')
const manageDpsUserRouter = require('./routes/manageDpsUserRouter')
const manageGroupsRouter = require('./routes/manageGroupsRouter')
const manageRolesRouter = require('./routes/manageRolesRouter')
const currentUser = require('./middleware/currentUser')
const featureSwitches = require('./middleware/featureSwitches')
const config = require('./config')

const configureRoutes = ({ oauthApi, prisonApi, manageUsersApi, nomisUsersAndRolesApi }) => {
  const router = express.Router()

  router.use(currentUser({ oauthApi, nomisUsersAndRolesApi }))
  router.use(featureSwitches(config))

  router.use('/', menuRouter({ manageUsersApi }))
  router.use('/create-external-user', createAuthUserRouter({ oauthApi }))
  router.use('/search-external-users', searchExternalUserRouter({ oauthApi }))
  router.use('/search-dps-users', searchDpsUserRouter({ prisonApi, oauthApi, nomisUsersAndRolesApi, manageUsersApi }))
  router.use(
    '/search-with-filter-dps-users',
    searchWithFilterDpsUserRouter({ prisonApi, oauthApi, nomisUsersAndRolesApi, manageUsersApi }),
  )
  router.use('/manage-external-users/:userId', manageAuthUserRouter({ oauthApi }))
  router.use('/manage-dps-users/:userId', manageDpsUserRouter({ oauthApi, nomisUsersAndRolesApi, manageUsersApi }))
  router.use('/manage-groups', manageGroupsRouter({ oauthApi }))
  router.use('/manage-roles', manageRolesRouter({ oauthApi, manageUsersApi }))

  return router
}

module.exports = configureRoutes
