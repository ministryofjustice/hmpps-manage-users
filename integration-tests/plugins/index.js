const auth = require('../mockApis/auth')
const manageUsersApi = require('../mockApis/manageUsers')
const tokenVerification = require('../mockApis/tokenVerification')
const nomisUsersAndRoles = require('../mockApis/nomisUsersAndRoles')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...auth,
    reset: resetStubs,
    stubSignIn: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }], userCaseloads = null }) =>
      Promise.all([
        auth.stubSignIn(username, roles),
        auth.stubUserMe({}),
        nomisUsersAndRoles.stubUserCaseloads(userCaseloads),
        tokenVerification.stubVerifyToken(true),
      ]),
    stubAuthHealth: (status) => auth.stubHealth(status),
    stubHealthAllHealthy: () =>
      Promise.all([
        auth.stubHealth(),
        manageUsersApi.stubHealth(),
        tokenVerification.stubHealth(),
        nomisUsersAndRoles.stubHealth(),
      ]),
    stubVerifyToken: (active = true) => tokenVerification.stubVerifyToken(active),
    stubSignInPage: auth.redirect,
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
