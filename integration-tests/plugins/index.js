const auth = require('../mockApis/auth')
const manageUsersApi = require('../mockApis/manageusers')
const tokenverification = require('../mockApis/tokenverification')
const nomisUsersAndRoles = require('../mockApis/nomisusersandroles')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...auth,
    reset: resetStubs,
    stubSignIn: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] }) =>
      Promise.all([
        auth.stubSignIn(username, roles),
        auth.stubUserMe({}),
        nomisUsersAndRoles.stubUserCaseloads(),
        tokenverification.stubVerifyToken(true),
      ]),
    stubAuthHealth: (status) => auth.stubHealth(status),
    stubHealthAllHealthy: () =>
      Promise.all([
        auth.stubHealth(),
        manageUsersApi.stubHealth(),
        tokenverification.stubHealth(),
        nomisUsersAndRoles.stubHealth(),
      ]),
    stubVerifyToken: (active = true) => tokenverification.stubVerifyToken(active),
    stubSignInPage: auth.redirect,
    ...manageUsersApi,
    ...nomisUsersAndRoles,
    stubDpsGetRoles: nomisUsersAndRoles.stubGetRoles,
    stubDpsGetAdminRoles: nomisUsersAndRoles.stubGetRolesIncludingAdminRoles,
    stubDpsUserDetails: nomisUsersAndRoles.stubUserDetails,
    stubDpsUserDetailsWithOutEmail: nomisUsersAndRoles.stubUserDetailsWithoutEmail,
    stubManageUserGetAdminRoles: manageUsersApi.stubGetRolesIncludingAdminRoles,
    stubManageUserGetRoles: manageUsersApi.stubGetRoles,
  })
}
