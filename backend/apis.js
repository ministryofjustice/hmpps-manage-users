const config = require('./config').default
const clientFactory = require('./api/oauthEnabledClient')
const { oauthApiFactory } = require('./api/oauthApi')
const { manageUsersApiFactory } = require('./api/manageUsersApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')
const { nomisUsersAndRolesFactory } = require('./api/nomisUsersAndRolesApi')

const oauthApi = oauthApiFactory(
  clientFactory({
    baseUrl: config.apis.oauth2.url,
    timeout: config.apis.oauth2.timeoutSeconds * 1000,
  }),
  { ...config.apis.oauth2 },
)

const manageUsersApi = manageUsersApiFactory(
  clientFactory({
    baseUrl: config.apis.manageusers.url,
    timeout: config.apis.manageusers.timeout.response,
  }),
)

const tokenVerificationApi = tokenVerificationApiFactory(
  clientFactory({
    baseUrl: config.apis.tokenverification.url,
    timeout: config.apis.tokenverification.timeoutSeconds * 1000,
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
