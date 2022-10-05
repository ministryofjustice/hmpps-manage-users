const config = require('../server/config').default
const clientFactory = require('./api/oauthEnabledClient')
const { oauthApiFactory } = require('./api/oauthApi')
const { manageUsersApiFactory } = require('./api/manageUsersApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')
const { nomisUsersAndRolesFactory } = require('./api/nomisUsersAndRolesApi')

const oauthApi = oauthApiFactory(
  clientFactory({
    baseUrl: config.apis.hmppsAuth.url,
    timeout: config.apis.hmppsAuth.timeout.response,
  }),
  { ...config.apis.hmppsAuth },
)

const manageUsersApi = manageUsersApiFactory(
  clientFactory({
    baseUrl: config.apis.manageUsers.url,
    timeout: config.apis.manageUsers.timeout.response,
  }),
)

const tokenVerificationApi = tokenVerificationApiFactory(
  clientFactory({
    baseUrl: config.apis.tokenVerification.url,
    timeout: config.apis.tokenVerification.timeout.response,
  }),
)

const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(
  clientFactory({
    baseUrl: config.apis.nomisUsersAndRoles.url,
    timeout: config.apis.nomisUsersAndRoles.timeout.response,
  }),
)
module.exports = {
  oauthApi,
  manageUsersApi,
  tokenVerificationApi,
  nomisUsersAndRolesApi,
}
