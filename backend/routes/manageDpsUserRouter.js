const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectCaseloadsFactory } = require('../controllers/addUserCaseload')
const { selectRolesFactory } = require('../controllers/addRole')
const { userDetailsFactory } = require('../controllers/userDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const getUserAssignableRolesAndMessageApi = async (context, username, hasAdminRole) => {
    const [user, userRoles, allRoles, bannerMessage] = await Promise.all([
      manageUsersApi.getDpsUser(context, username),
      manageUsersApi.contextUserRoles(context, username),
      manageUsersApi.getRoles(context, { adminTypes: hasAdminRole ? 'DPS_ADM' : 'DPS_LSA' }),
      manageUsersApi.getNotificationBannerMessage(context, 'ROLES'),
    ])
    return [
      user,
      allRoles.filter((r) => !userRoles.dpsRoles.some((userRole) => userRole.code === r.roleCode)),
      bannerMessage,
    ]
  }

  const getUserRolesAndCaseloadsApi = async (context, username) => {
    await manageUsersApi.syncDpsEmail(context, username)

    const [user, roles, userEmail, userCaseloads] = await Promise.all([
      manageUsersApi.getDpsUser(context, username),
      manageUsersApi.contextUserRoles(context, username),
      manageUsersApi.getUserEmail(context, { username }),
      manageUsersApi.getUserCaseloads(context, username),
    ])

    return [
      {
        ...user,
        email: user.primaryEmail,
        emailToVerify: userEmail.email,
        verified: userEmail.verified,
        activeCaseload: roles.activeCaseload,
      },
      roles.dpsRoles.map((r) => ({ roleCode: r.code, roleName: r.name, adminRoleOnly: r.adminRoleOnly })),
      undefined, // no groups for DPS users
      userCaseloads.caseloads,
    ]
  }

  const getUserAssignableCaseloadsApi = async (context, username) => {
    const [user, userCaseloads, allCaseloads] = await Promise.all([
      manageUsersApi.getDpsUser(context, username),
      manageUsersApi.getUserCaseloads(context, username),
      manageUsersApi.getCaseloads(context),
    ])
    return [
      user,
      allCaseloads.filter((c) => !userCaseloads.caseloads?.some((userCaseload) => userCaseload.id === c.id)),
    ]
  }

  const getUserApi = async (context, username) => {
    const [user, userEmail] = await Promise.all([
      manageUsersApi.getDpsUser(context, username),
      manageUsersApi.getUserEmail(context, { username }),
    ])
    return { ...user, email: userEmail.email }
  }

  const enableUserApi = (context, username) => manageUsersApi.enablePrisonUser(context, username)
  const disableUserApi = (context, username) => manageUsersApi.disablePrisonUser(context, username)
  const saveUserRolesApi = (context, username, roles) => manageUsersApi.addDpsUserRoles(context, username, roles)
  const removeUserRoleApi = (context, username, role) => manageUsersApi.removeDpsUserRole(context, username, role)

  const saveUserCaseloadsApi = (context, username, caseloads) =>
    manageUsersApi.addUserCaseloads(context, username, caseloads)
  const removeUserCaseloadApi = (context, username, caseload) =>
    manageUsersApi.removeUserCaseload(context, username, caseload)

  const changeEmailApi = (context, username, email) => manageUsersApi.changeDpsEmail(context, username, { email })

  const { index: selectRoles, post: postRoles } = selectRolesFactory(
    getUserAssignableRolesAndMessageApi,
    saveUserRolesApi,
    '/manage-dps-users',
  )

  const { index: selectUserCaseloads, post: postUserCaseloads } = selectCaseloadsFactory(
    getUserAssignableCaseloadsApi,
    saveUserCaseloadsApi,
    '/manage-dps-users',
  )

  const {
    index: userDetails,
    removeRole,
    requestRoleRemoval,
    removeUserCaseload,
    enableUser,
    disableUser,
  } = userDetailsFactory(
    getUserRolesAndCaseloadsApi,
    removeUserRoleApi,
    undefined,
    removeUserCaseloadApi,
    enableUserApi,
    disableUserApi,
    '/search-with-filter-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    false,
    false,
  )

  const {
    index: getEmail,
    post: postEmail,
    success: emailSuccess,
  } = changeEmailFactory(getUserApi, changeEmailApi, '/manage-dps-users')

  router.get('/select-roles', selectRoles)
  router.post('/select-roles', postRoles)
  router.post('/roles/:role/remove', removeRole)
  router.get('/roles/:role/request-removal', requestRoleRemoval)
  router.get('/select-caseloads', selectUserCaseloads)
  router.post('/select-caseloads', postUserCaseloads)
  router.post('/caseloads/:caseload/remove', removeUserCaseload)
  router.get('/details', userDetails)
  router.get('/change-email', getEmail)
  router.post('/change-email', postEmail)
  router.get('/change-email-success', emailSuccess)
  router.post('/activate', enableUser)
  router.post('/deactivate', disableUser)

  return router
}

module.exports = (dependencies) => controller(dependencies)
