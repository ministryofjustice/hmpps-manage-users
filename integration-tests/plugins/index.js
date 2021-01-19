const auth = require('../mockApis/auth')
const prisonApi = require('../mockApis/prison')
const tokenverification = require('../mockApis/tokenverification')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = (on) => {
  on('task', {
    ...auth,
    reset: resetStubs,
    resetAndStubTokenVerification: async () => {
      await resetStubs()
      return tokenverification.stubVerifyToken(true)
    },
    stubLogin: ({ username = 'ITAG_USER', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] }) =>
      Promise.all([
        auth.stubLogin(username, roles),
        auth.stubUserMe({}),
        prisonApi.stubUserCaseloads(),
        tokenverification.stubVerifyToken(true),
      ]),
    stubVerifyToken: (active = true) => tokenverification.stubVerifyToken(active),
    stubLoginPage: auth.redirect,
    stubDpsGetRoles: prisonApi.stubGetRoles,
    stubDpsGetAdminRoles: prisonApi.stubGetRolesIncludingAdminRoles,
    stubDpsSearch: prisonApi.stubDpsSearch,
    stubDpsUserDetails: prisonApi.stubUserDetails,
    stubDpsUserGetRoles: prisonApi.stubUserGetRoles,
    verifyDpsSearch: prisonApi.verifyDpsSearch,
  })
}
