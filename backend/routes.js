const express = require('express')
const { logError } = require('./logError')

const withErrorHandler = require('./middleware/asyncHandler')
const { userMeFactory } = require('./controllers/userMe')
const { getRolesFactory } = require('./controllers/getRoles')
const { getUserFactory } = require('./controllers/getUser')
const { removeRoleFactory } = require('./controllers/removeRole')
const { addRoleFactory } = require('./controllers/addRole')
const { contextUserRolesFactory } = require('./controllers/contextUserRoles')
const { userSearchFactory } = require('./controllers/userSearch')
const authUserMaintenanceFactory = require('./controllers/authUserMaintenance')
const { getConfiguration } = require('./controllers/getConfig')
const menuRouter = require('./routes/menuRouter')
const manageAuthUserRouter = require('./routes/manageAuthUserRouter')
const manageGroupsRouter = require('./routes/manageGroupsRouter')
const currentUser = require('./middleware/currentUser')

const configureRoutes = ({ oauthApi, prisonApi }) => {
  const router = express.Router()

  router.use('/api/config', withErrorHandler(getConfiguration))
  router.use('/api/me', withErrorHandler(userMeFactory(oauthApi).userMeService))
  router.use('/api/userSearch', withErrorHandler(userSearchFactory(prisonApi).userSearch))
  const authUserMaintenance = authUserMaintenanceFactory(oauthApi)
  router.use('/api/auth-user-get', withErrorHandler(authUserMaintenance.getUser))
  router.use('/api/auth-user-create', withErrorHandler(authUserMaintenance.createUser))
  router.use('/api/auth-user-search', withErrorHandler(authUserMaintenance.search))
  router.use('/api/auth-user-roles', withErrorHandler(authUserMaintenance.roles))
  router.use('/api/auth-user-groups', withErrorHandler(authUserMaintenance.groups))
  router.use('/api/auth-user-roles-remove', withErrorHandler(authUserMaintenance.removeRole))
  router.use('/api/auth-user-groups-add', withErrorHandler(authUserMaintenance.addGroup))
  router.use('/api/auth-user-groups-remove', withErrorHandler(authUserMaintenance.removeGroup))
  router.use('/api/auth-user-enable', withErrorHandler(authUserMaintenance.enableUser))
  router.use('/api/auth-user-disable', withErrorHandler(authUserMaintenance.disableUser))
  router.use('/api/auth-roles', withErrorHandler(authUserMaintenance.assignableRoles))
  router.use('/api/auth-groups', withErrorHandler(authUserMaintenance.assignableGroups))
  router.use('/api/auth-user-create', withErrorHandler(authUserMaintenance.createUser))
  router.use('/api/auth-user-amend', withErrorHandler(authUserMaintenance.amendUser))
  router.use('/api/getRoles', withErrorHandler(getRolesFactory(prisonApi).getRoles))
  router.use('/api/getUser', withErrorHandler(getUserFactory(prisonApi).getUser))
  router.use('/api/removeRole', withErrorHandler(removeRoleFactory(prisonApi).removeRole))
  router.use('/api/addRole', withErrorHandler(addRoleFactory(prisonApi).addRole))
  router.use('/api/contextUserRoles', withErrorHandler(contextUserRolesFactory(prisonApi).contextUserRoles))

  router.use(currentUser({ prisonApi, oauthApi }))

  router.use('/', menuRouter({ logError }))
  router.use('/manage-auth-users/:username', manageAuthUserRouter({ oauthApi, logError }))
  router.use('/manage-groups', manageGroupsRouter({ oauthApi, logError }))

  return router
}

module.exports = configureRoutes
