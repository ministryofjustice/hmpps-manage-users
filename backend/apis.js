const config = require('./config').default
const { oauthApiFactory } = require('./api/oauthApi')
const { manageUsersApiFactory } = require('./api/manageUsersApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')
const { oauthEnabledClientFactory } = require('./api/oauthEnabledClient')

const oauthApi = oauthApiFactory({
  apiClientId: config.apis.hmppsAuth.apiClientId,
  apiClientSecret: config.apis.hmppsAuth.apiClientSecret,
  url: config.apis.hmppsAuth.url,
})

const manageUsersApi = manageUsersApiFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.manageUsers.url,
    timeout: config.apis.manageUsers.timeout.response,
  }),
)

const tokenVerificationApi = tokenVerificationApiFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.tokenVerification.url,
    timeout: config.apis.tokenVerification.timeoutSeconds * 1000,
  }),
)

module.exports = {
  oauthApi,
  manageUsersApi,
  tokenVerificationApi,
}
