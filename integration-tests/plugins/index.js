const hmppsAuth = require('../mockApis/auth')
const manageUsersApi = require('../mockApis/manageusers')
const tokenVerification = require('../mockApis/tokenverification')
const manageUserApiDps = require('../mockApis/manageusersdps')
const manageUsersAllowList = require('../mockApis/manageUsersAllowList').default

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...hmppsAuth,
    reset: resetStubs,
    stubSignIn: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }], userCaseloads = null }) =>
      Promise.all([
        hmppsAuth.stubSignIn(username, roles),
        manageUsersApi.stubUserMe({}),
        manageUserApiDps.stubUserCaseloads(userCaseloads),
        tokenVerification.stubVerifyToken(true),
      ]),
    stubAuthHealth: (status) => hmppsAuth.stubHealth(status),
    stubHealthAllHealthy: () =>
      Promise.all([hmppsAuth.stubHealth(), manageUsersApi.stubHealth(), tokenVerification.stubHealth()]),
    stubVerifyToken: (active = true) => tokenVerification.stubVerifyToken(active),
    stubSignInPage: hmppsAuth.redirect,
    ...manageUsersApi,
    ...manageUserApiDps,
    stubDpsUserDetails: ({ accountStatus, active = true, enabled = true, administratorOfUserGroups = null }) =>
      manageUserApiDps.stubUserDetails({ accountStatus, active, enabled, administratorOfUserGroups }),
    stubDpsUserDetailsWithOutEmail: manageUserApiDps.stubUserDetailsWithoutEmail,
    stubManageUserGetAdminRoles: manageUsersApi.stubGetRolesIncludingAdminRoles,
    stubManageUserGetOauthAdminRoles: manageUsersApi.stubGetRolesIncludingOAUTHAdminRoles,
    stubManageUserGetRoles: manageUsersApi.stubGetRoles,
    ...manageUsersAllowList,
  })
}
