const auth = require('../mockApis/auth')
const prisonApi = require('../mockApis/prison')
const manageUsersApi = require('../mockApis/manageusers')
const tokenverification = require('../mockApis/tokenverification')
const nomisUsersAndRoles = require('../mockApis/nomisusersandroles')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...auth,
    reset: resetStubs,
    resetAndStubTokenVerification: async () => {
      await resetStubs()
      return tokenverification.stubVerifyToken(true)
    },
    stubSignIn: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] }) =>
      Promise.all([
        auth.stubSignIn(username, roles),
        auth.stubUserMe({}),
        prisonApi.stubUserCaseloads(),
        tokenverification.stubVerifyToken(true),
      ]),
    stubPrisonApiHealth: (status) => prisonApi.stubHealth(status),
    stubHealthAllHealthy: () =>
      Promise.all([
        auth.stubHealth(),
        prisonApi.stubHealth(),
        manageUsersApi.stubHealth(),
        tokenverification.stubHealth(),
        nomisUsersAndRoles.stubHealth(),
      ]),
    stubVerifyToken: (active = true) => tokenverification.stubVerifyToken(active),
    stubSignInPage: auth.redirect,
    ...prisonApi,
    ...manageUsersApi,
    stubDpsGetRoles: prisonApi.stubGetRoles,
    stubDpsGetAdminRoles: prisonApi.stubGetRolesIncludingAdminRoles,
    stubDpsUserDetails: prisonApi.stubUserDetails,
    stubDpsUserGetRoles: prisonApi.stubUserGetRoles,
  })
}
