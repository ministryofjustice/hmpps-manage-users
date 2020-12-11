const express = require('express')
const { selectRolesFactory } = require('../controllers/addRole')
const { userDetailsFactory } = require('../controllers/userDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, logError }) => {
  const getUserAndAssignableRolesApi = (context, username, hasAdminRole) =>
    Promise.all([prisonApi.getUser(context, username), prisonApi.assignableRoles(context, username, hasAdminRole)])
  const getUserAndRolesApi = (context, username, hasAdminRole) =>
    Promise.all([prisonApi.getUser(context, username), prisonApi.contextUserRoles(context, username, hasAdminRole)])

  const saveRolesApi = (context, username, roles) => prisonApi.addUserRoles(context, username, roles)
  const removeRoleApi = (context, username, role) => prisonApi.removeRole(context, username, role)

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAndAssignableRolesApi,
    saveRolesApi,
    '/search-dps-users',
    '/manage-dps-users',
    logError
  )

  const { index: userDetails, removeRole } = userDetailsFactory(
    getUserAndRolesApi,
    removeRoleApi,
    undefined,
    undefined,
    undefined,
    '/search-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    false,
    logError
  )

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.get('/roles/:role/remove', removeRole)
  router.get('/', userDetails)

  return router
}

module.exports = (dependencies) => controller(dependencies)
