const express = require('express')
const { changeEmailFactory } = require('../controllers/changeEmail')
const { selectCaseloadsFactory } = require('../controllers/addUserCaseload')
const { selectRolesFactory } = require('../controllers/addRole')
const { userDetailsFactory } = require('../controllers/userDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ nomisUsersAndRolesApi, manageUsersApi }) => {
  const getUserAssignableRolesAndMessageApi = async (context, username, hasAdminRole) => {
    const [user, userRoles, allRoles, bannerMessage] = await Promise.all([
      nomisUsersAndRolesApi.getUser(context, username),
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
      nomisUsersAndRolesApi.getUser(context, username),
      manageUsersApi.contextUserRoles(context, username),
      manageUsersApi.getUserEmail(context, { username }),
      nomisUsersAndRolesApi.getUserCaseloads(context, username),
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
      nomisUsersAndRolesApi.getUser(context, username),
      nomisUsersAndRolesApi.getUserCaseloads(context, username),
      nomisUsersAndRolesApi.getCaseloads(context),
    ])
    return [
      user,
      allCaseloads.filter((c) => !userCaseloads.caseloads?.some((userCaseload) => userCaseload.id === c.id)),
    ]
  }

  const getUserApi = async (context, username) => {
    const [user, userEmail] = await Promise.all([
      nomisUsersAndRolesApi.getUser(context, username),
      manageUsersApi.getUserEmail(context, { username }),
    ])
    return { ...user, email: userEmail.email }
  }

  const enableUserApi = (context, username) => nomisUsersAndRolesApi.enableUser(context, { username })
  const disableUserApi = (context, username) => nomisUsersAndRolesApi.disableUser(context, { username })

  const saveUserRolesApi = (context, username, roles) => nomisUsersAndRolesApi.addUserRoles(context, username, roles)
  const removeUserRoleApi = (context, username, role) => nomisUsersAndRolesApi.removeUserRole(context, username, role)

  const saveUserCaseloadsApi = (context, username, caseloads) =>
    nomisUsersAndRolesApi.addUserCaseloads(context, username, caseloads)
  const removeUserCaseloadApi = (context, username, caseload) =>
    nomisUsersAndRolesApi.removeUserCaseload(context, username, caseload)

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
