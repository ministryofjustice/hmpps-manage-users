const config = require('./config').default
const clientFactory = require('./api/oauthEnabledClient')
const { oauthApiFactory } = require('./api/oauthApi')
const { manageUsersApiFactory } = require('./api/manageUsersApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')
const { nomisUsersAndRolesFactory } = require('./api/nomisUsersAndRolesApi')

const oauthApi = oauthApiFactory({
  apiClientId: config.apis.hmppsAuth.apiClientId,
  apiClientSecret: config.apis.hmppsAuth.apiClientSecret,
  url: config.apis.hmppsAuth.url,
})

const manageUsersApi = manageUsersApiFactory(
  clientFactory({
    baseUrl: config.apis.manageUsers.url,
    timeout: config.apis.manageUsers.timeout.response,
  }),
)

const tokenVerificationApi = tokenVerificationApiFactory(
  clientFactory({
    baseUrl: config.apis.tokenVerification.url,
    timeout: config.apis.tokenVerification.timeoutSeconds * 1000,
  }),
)

const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(
  clientFactory({
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
