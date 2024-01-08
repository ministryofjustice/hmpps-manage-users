const config = require('./config').default
const { oauthApiFactory } = require('./api/oauthApi')
const { manageUsersApiFactory } = require('./api/manageUsersApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')
const { nomisUsersAndRolesFactory } = require('./api/nomisUsersAndRolesApi')
const { oauthEnabledClientFactory } = require('./api/oauthEnabledClient')

const oauthApi = oauthApiFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.hmppsAuth.url,
    timeout: config.apis.hmppsAuth.timeoutSeconds * 1000,
  }),
  { ...config.apis.hmppsAuth },
)

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

const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.nomisUsersAndRoles.url,
    timeout: config.apis.nomisUsersAndRoles.timeoutSeconds * 1000,
  }),
)
module.exports = {
  oauthApi,
  manageUsersApi,
  tokenVerificationApi,
  nomisUsersAndRolesApi,
}
