const auth = require('../mockApis/auth')
const elite2api = require('../mockApis/elite2')
const tokenverification = require('../mockApis/tokenverification')

const { resetStubs } = require('../mockApis/wiremock')

module.exports = on => {
  on('task', {
    reset: resetStubs,
    resetAndStubTokenVerification: async () => {
      await resetStubs()
      return tokenverification.stubVerifyToken(true)
    },
    getLoginUrl: auth.getLoginUrl,
    stubLogin: ({ username = 'ITAG_USER', caseload = 'MDI', roles = [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }] }) =>
      Promise.all([
        auth.stubLogin(username, caseload, roles),
        elite2api.stubUserMe(),
        elite2api.stubUserCaseloads(),
        tokenverification.stubVerifyToken(true),
      ]),
    stubVerifyToken: (active = true) => tokenverification.stubVerifyToken(active),
    stubLoginPage: auth.redirect,
  })
}
