const hmppsAuth = require('../mockApis/auth')
const manageUsersApi = require('../mockApis/manageusers')
const tokenVerification = require('../mockApis/tokenverification')
const nomisUsersAndRoles = require('../mockApis/nomisusersandroles')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...hmppsAuth,
    reset: resetStubs,
    stubSignIn: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }], userCaseloads = null }) =>
      Promise.all([
        hmppsAuth.stubSignIn(username, roles),
        manageUsersApi.stubUserMe({}),
        nomisUsersAndRoles.stubUserCaseloads(userCaseloads),
        tokenVerification.stubVerifyToken(true),
      ]),
    stubAuthHealth: (status) => hmppsAuth.stubHealth(status),
    stubHealthAllHealthy: () =>
      Promise.all([
        hmppsAuth.stubHealth(),
        manageUsersApi.stubHealth(),
        tokenVerification.stubHealth(),
        nomisUsersAndRoles.stubHealth(),
      ]),
    stubVerifyToken: (active = true) => tokenVerification.stubVerifyToken(active),
    stubSignInPage: hmppsAuth.redirect,
    ...manageUsersApi,
    ...nomisUsersAndRoles,
    stubDpsGetRoles: nomisUsersAndRoles.stubGetRoles,
    stubDpsGetAdminRoles: nomisUsersAndRoles.stubGetRolesIncludingAdminRoles,
    stubDpsUserDetails: ({ accountStatus, active = true, enabled = true }) =>
      nomisUsersAndRoles.stubUserDetails({ accountStatus, active, enabled }),
    stubDpsUserDetailsWithOutEmail: nomisUsersAndRoles.stubUserDetailsWithoutEmail,
    stubManageUserGetAdminRoles: manageUsersApi.stubGetRolesIncludingAdminRoles,
    stubManageUserGetRoles: manageUsersApi.stubGetRoles,
  })
}
