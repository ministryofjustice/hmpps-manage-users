import { oauthApiFactory } from './api/oauthApi'
import { oauthEnabledClientFactory } from './api/oauthEnabledClient'
import config from './config'
import { tokenVerificationApiFactory } from './api/tokenVerificationApi'
import { nomisUsersAndRolesFactory } from './api/nomisUsersAndRolesApi'
import { manageUsersApiFactory } from './api/manageUsersApi'

const oauthApi = oauthApiFactory(config.apis.hmppsAuth)

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
