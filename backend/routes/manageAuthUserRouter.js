const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectRolesFactory } = require('../controllers/addRole')
const { selectGroupFactory } = require('../controllers/addGroup')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getUserAndRoles = (context, username) =>
    Promise.all([oauthApi.assignableRoles(context, { username }), oauthApi.getUser(context, { username })])

  const getUserAndGroups = (context, username) =>
    Promise.all([
      oauthApi.assignableGroups(context, { username }),
      oauthApi.getUser(context, { username }),
      oauthApi.userGroups(context, { username }),
    ])

  const getUser = (context, username) => oauthApi.getUser(context, { username })

  const saveGroup = (context, username, group) => oauthApi.addUserGroup(context, { username, group })

  const saveRoles = (context, username, roles) => oauthApi.addUserRoles(context, { username, roles })

  const changeEmail = (context, username, email) => oauthApi.amendUser(context, username, { email })

  const { index: selectGroup, post: postGroup } = selectGroupFactory(
    getUserAndGroups,
    saveGroup,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAndRoles,
    saveRoles,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  const { index: getEmail, post: postEmail } = changeEmailFactory(
    getUser,
    changeEmail,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.get('/select-group', selectGroup)
  router.post('/select-group', postGroup)
  router.get('/change-email', getEmail)
  router.post('/change-email', postEmail)
  return router
}

module.exports = (dependencies) => controller(dependencies)
