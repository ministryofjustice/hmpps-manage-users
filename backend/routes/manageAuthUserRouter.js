const express = require('express')
const { selectRolesFactory } = require('../controllers/addRole')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getUserAndRoles = (context, username) =>
    Promise.all([oauthApi.assignableRoles(context, { username }), oauthApi.getUser(context, { username })])

  const saveRoles = (context, username, roles) => oauthApi.addUserRoles(context, { username, roles })

  const { index, post } = selectRolesFactory(
    getUserAndRoles,
    saveRoles,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  router.get('/', index)
  router.post('/', post)
  return router
}

module.exports = (dependencies) => controller(dependencies)
