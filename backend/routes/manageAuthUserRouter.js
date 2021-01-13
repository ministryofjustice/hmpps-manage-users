const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectRolesFactory } = require('../controllers/addRole')
const { selectGroupFactory } = require('../controllers/addGroup')
const { userDetailsFactory } = require('../controllers/userDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getUserAndAssignableRolesApi = (context, username) =>
    Promise.all([oauthApi.getUser(context, { username }), oauthApi.assignableRoles(context, { username })])

  const getUserAndGroupsApi = (context, username) =>
    Promise.all([
      oauthApi.getUser(context, { username }),
      oauthApi.assignableGroups(context, { username }),
      oauthApi.userGroups(context, { username }),
    ])

  const getUserRolesAndGroupsApi = (context, username) =>
    Promise.all([
      oauthApi.getUser(context, { username }),
      oauthApi.userRoles(context, { username }),
      oauthApi.userGroups(context, { username }),
    ])

  const getUserApi = (context, username) => oauthApi.getUser(context, { username })

  const saveGroupApi = (context, username, group) => oauthApi.addUserGroup(context, { username, group })
  const removeGroupApi = (context, username, group) => oauthApi.removeUserGroup(context, { username, group })
  const saveRolesApi = (context, username, roles) => oauthApi.addUserRoles(context, { username, roles })
  const removeRoleApi = (context, username, role) => oauthApi.removeUserRole(context, { username, role })
  const changeEmailApi = (context, username, email) => oauthApi.amendUser(context, username, { email })
  const enableUserApi = (context, username) => oauthApi.enableUser(context, { username })
  const disableUserApi = (context, username) => oauthApi.disableUser(context, { username })

  const { index: selectGroup, post: postGroup } = selectGroupFactory(
    getUserAndGroupsApi,
    saveGroupApi,
    '/search-external-users',
    '/manage-external-users',
  )

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAndAssignableRolesApi,
    saveRolesApi,
    '/search-external-users',
    '/manage-external-users',
  )

  const { index: getEmail, post: postEmail } = changeEmailFactory(
    getUserApi,
    changeEmailApi,
    '/search-external-users',
    '/manage-external-users',
  )

  const { index: userDetails, removeRole, removeGroup, enableUser, disableUser } = userDetailsFactory(
    getUserRolesAndGroupsApi,
    removeRoleApi,
    removeGroupApi,
    enableUserApi,
    disableUserApi,
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
    true,
  )

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.get('/roles/:role/remove', removeRole)
  router.get('/select-group', selectGroup)
  router.post('/select-group', postGroup)
  router.get('/groups/:group/remove', removeGroup)
  router.get('/change-email', getEmail)
  router.post('/change-email', postEmail)
  router.get('/activate', enableUser)
  router.get('/deactivate', disableUser)
  router.get('/', userDetails)
  return router
}

module.exports = (dependencies) => controller(dependencies)
