const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectRolesFactory } = require('../controllers/addRole')
const { userDetailsFactory } = require('../controllers/userDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, nomisUsersAndRolesApi }) => {
  const getUserAndAssignableRolesApi = (context, username, hasAdminRole) =>
    Promise.all([
      nomisUsersAndRolesApi.getUser(context, username),
      nomisUsersAndRolesApi.assignableRoles(context, username, hasAdminRole),
    ])

  const getUserAndRolesApi = async (context, username) => {
    const [user, roles, userEmail] = await Promise.all([
      nomisUsersAndRolesApi.getUser(context, username),
      nomisUsersAndRolesApi.contextUserRoles(context, username),
      oauthApi.getUserEmail(context, { username }),
    ])
    return [
      { ...user, email: userEmail.email, verified: userEmail.verified },
      roles.dpsRoles.map((r) => ({ roleCode: r.code, roleName: r.name, adminRoleOnly: r.adminRoleOnly })),
    ]
  }
  const getUserApi = async (context, username) => {
    const [user, userEmail] = await Promise.all([
      nomisUsersAndRolesApi.getUser(context, username),
      oauthApi.getUserEmail(context, { username }),
    ])
    return { ...user, email: userEmail.email }
  }

  const saveRolesApi = (context, username, roles) => nomisUsersAndRolesApi.addUserRoles(context, username, roles)
  const removeRoleApi = (context, username, role) => nomisUsersAndRolesApi.removeRole(context, username, role)

  const changeEmailApi = (context, username, email) => oauthApi.changeDpsEmail(context, username, { email })

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAndAssignableRolesApi,
    saveRolesApi,
    '/search-dps-users',
    '/manage-dps-users',
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
  )

  const {
    index: getEmail,
    post: postEmail,
    success: emailSuccess,
  } = changeEmailFactory(getUserApi, changeEmailApi, '/search-dps-users', '/manage-dps-users')

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.get('/roles/:role/remove', removeRole)
  router.get('/details', userDetails)
  router.get('/change-email', getEmail)
  router.post('/change-email', postEmail)
  router.get('/change-email-success', emailSuccess)

  return router
}

module.exports = (dependencies) => controller(dependencies)
