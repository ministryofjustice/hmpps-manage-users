const express = require('express')
const config = require('./config')

const withErrorHandler = require('./middleware/asyncHandler')
const { userLocationsFactory } = require('./controllers/userLocations')
const { userMeFactory } = require('./controllers/userMe')
const { getRolesFactory } = require('./controllers/getRoles')
const { getUserFactory } = require('./controllers/getUser')
const { removeRoleFactory } = require('./controllers/removeRole')
const { addRoleFactory } = require('./controllers/addRole')
const { contextUserRolesFactory } = require('./controllers/contextUserRoles')
const { userSearchFactory } = require('./controllers/userSearch')
const authUserMaintenanceFactory = require('./controllers/authUserMaintenance')
const { getConfiguration } = require('./controllers/getConfig')
const userCaseLoadsFactory = require('./controllers/usercaseloads').userCaseloadsFactory
const setActiveCaseLoadFactory = require('./controllers/setactivecaseload').activeCaseloadFactory

const controllerFactory = require('./controllers/controller').factory

const configureRoutes = ({ oauthApi, elite2Api }) => {
  const router = express.Router()

  router.use('/api/config', withErrorHandler(getConfiguration))
  router.use('/api/me', withErrorHandler(userMeFactory(oauthApi, elite2Api).userMeService))
  router.use('/api/usercaseloads', withErrorHandler(userCaseLoadsFactory(elite2Api).userCaseloads))
  router.use('/api/setactivecaseload', withErrorHandler(setActiveCaseLoadFactory(elite2Api).setActiveCaseload))
  router.use('/api/userLocations', withErrorHandler(userLocationsFactory(elite2Api).userLocations))
  router.use('/api/userSearch', withErrorHandler(userSearchFactory(elite2Api).userSearch))
  const authUserMaintenance = authUserMaintenanceFactory(oauthApi)
  router.use('/api/auth-user-get', withErrorHandler(authUserMaintenance.getUser))
  router.use('/api/auth-user-create', withErrorHandler(authUserMaintenance.createUser))
  router.use('/api/auth-user-search', withErrorHandler(authUserMaintenance.search))
  router.use('/api/auth-user-roles', withErrorHandler(authUserMaintenance.roles))
  router.use('/api/auth-user-groups', withErrorHandler(authUserMaintenance.groups))
  router.use('/api/auth-user-roles-add', withErrorHandler(authUserMaintenance.addRole))
  router.use('/api/auth-user-roles-remove', withErrorHandler(authUserMaintenance.removeRole))
  router.use('/api/auth-user-groups-add', withErrorHandler(authUserMaintenance.addGroup))
  router.use('/api/auth-user-groups-remove', withErrorHandler(authUserMaintenance.removeGroup))
  router.use('/api/auth-user-enable', withErrorHandler(authUserMaintenance.enableUser))
  router.use('/api/auth-user-disable', withErrorHandler(authUserMaintenance.disableUser))
  router.use('/api/auth-roles', withErrorHandler(authUserMaintenance.assignableRoles))
  router.use('/api/auth-groups', withErrorHandler(authUserMaintenance.assignableGroups))
  router.use('/api/auth-user-create', withErrorHandler(authUserMaintenance.createUser))
  router.use('/api/auth-user-amend', withErrorHandler(authUserMaintenance.amendUser))
  router.use('/api/getRoles', withErrorHandler(getRolesFactory(elite2Api).getRoles))
  router.use('/api/getUser', withErrorHandler(getUserFactory(elite2Api).getUser))
  router.use('/api/removeRole', withErrorHandler(removeRoleFactory(elite2Api).removeRole))
  router.use('/api/addRole', withErrorHandler(addRoleFactory(elite2Api).addRole))
  router.use('/api/contextUserRoles', withErrorHandler(contextUserRolesFactory(elite2Api).contextUserRoles))

  return router
}

module.exports = configureRoutes
