const express = require('express')
const { selectRolesFactory } = require('../controllers/addRole')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, logError }) => {
  const getUserAndRolesApi = (context, username, hasAdminRole) =>
    Promise.all([prisonApi.assignableRoles(context, username, hasAdminRole), prisonApi.getUser(context, username)])

  const saveRolesApi = (context, username, roles) => prisonApi.addUserRoles(context, username, roles)

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAndRolesApi,
    saveRolesApi,
    '/maintain-roles',
    '/maintain-roles',
    'Manage user roles',
    logError
  )

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  return router
}

module.exports = (dependencies) => controller(dependencies)
