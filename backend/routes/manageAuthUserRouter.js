const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectRolesFactory } = require('../controllers/addRole')
const { selectGroupFactory } = require('../controllers/addGroup')
const { userDetailsFactory } = require('../controllers/userDetails')
const { deactivateUserReasonFactory } = require('../controllers/deactivateUserReason')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, manageUsersApi }) => {
  const getUserAssignableRolesMessageApi = (context, userId) =>
    Promise.all([oauthApi.getUser(context, { userId }), oauthApi.assignableRoles(context, { userId }), ''])

  const getUserAndGroupsApi = (context, userId) =>
    Promise.all([
      oauthApi.getUser(context, { userId }),
      oauthApi.assignableGroups(context),
      manageUsersApi.userGroups(context, { userId }),
    ])

  const getUserRolesAndGroupsApi = async (context, userId, hasMaintainDpsUsers, hasMaintainAuthUsers) => {
    const [user, roles, groups, assignableGroups] = await Promise.all([
      oauthApi.getUser(context, { userId }),
      manageUsersApi.externalUserRoles(context, userId),
      manageUsersApi.userGroups(context, { userId }),
      hasMaintainAuthUsers ? [] : oauthApi.assignableGroups(context),
    ])

    const assignableGroupsCodes = new Set(assignableGroups.map((g) => g.groupCode))
    return [
      user,
      roles,
      groups.map((g) => ({
        groupName: g.groupName,
        groupCode: g.groupCode,
        showRemove: hasMaintainAuthUsers || assignableGroupsCodes.has(g.groupCode),
      })),
    ]
  }

  const getUserApi = (context, userId) => oauthApi.getUser(context, { userId })
  const saveGroupApi = (context, userId, group) => manageUsersApi.addUserGroup(context, { userId, group })
  const removeGroupApi = (context, userId, group) => manageUsersApi.removeUserGroup(context, { userId, group })
  const saveRolesApi = (context, userId, roles) => oauthApi.addUserRoles(context, { userId, roles })
  const removeUserRoleApi = (context, userId, role) => manageUsersApi.deleteExternalUserRole(context, { userId, role })
  const changeEmailApi = (context, userId, email) => oauthApi.amendUserEmail(context, userId, { email })
  const enableUserApi = (context, userId) => manageUsersApi.enableExternalUser(context, { userId })
  const disableUserApi = (context, userId) => oauthApi.disableUser(context, { userId })
  const deactivateUserApi = (context, userId, reason) => oauthApi.deactivateUser(context, { userId, reason })

  const { index: selectGroup, post: postGroup } = selectGroupFactory(
    getUserAndGroupsApi,
    saveGroupApi,
    '/search-external-users',
    '/manage-external-users',
  )

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAssignableRolesMessageApi,
    saveRolesApi,
    '/manage-external-users',
  )

  const {
    index: getEmail,
    post: postEmail,
    success: emailSuccess,
  } = changeEmailFactory(getUserApi, changeEmailApi, '/manage-external-users')

  const {
    index: userDetails,
    removeRole,
    removeGroup,
    enableUser,
    disableUser,
  } = userDetailsFactory(
    getUserRolesAndGroupsApi,
    removeUserRoleApi,
    removeGroupApi,
    undefined,
    enableUserApi,
    disableUserApi,
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
    true,
    true,
  )

  const { index: deactivateUser, post: postDeactivateUser } = deactivateUserReasonFactory(
    deactivateUserApi,
    '/manage-external-users',
    'Deactivate user reason',
  )

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.post('/roles/:role/remove', removeRole)
  router.get('/select-group', selectGroup)
  router.post('/select-group', postGroup)
  router.post('/groups/:group/remove', removeGroup)
  router.get('/change-email', getEmail)
  router.get('/change-email-success', emailSuccess)
  router.post('/change-email', postEmail)
  router.post('/activate', enableUser)
  router.post('/deactivate', disableUser)
  router.get('/deactivate/reason', deactivateUser)
  router.post('/deactivate/reason', postDeactivateUser)
  router.get('/details', userDetails)
  return router
}

module.exports = (dependencies) => controller(dependencies)
