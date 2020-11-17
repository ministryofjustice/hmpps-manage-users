const express = require('express')
const { selectGroupFactory } = require('../controllers/addGroup')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getUserAndGroups = (context, username) =>
    Promise.all([oauthApi.assignableGroups(context, { username }), oauthApi.getUser(context, { username })])

  const saveGroup = (context, username, group) => oauthApi.addUserGroup(context, { username, group })

  const { index, post } = selectGroupFactory(
    getUserAndGroups,
    saveGroup,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  router.get('/', index)
  router.post('/', post)
  return router
}

module.exports = (dependencies) => controller(dependencies)
