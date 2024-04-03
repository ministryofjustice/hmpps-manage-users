import config from './config'
import { OAuthApi, oauthApiFactory } from './api/oauthApi'
import { ManageUsersApi, manageUsersApiFactory } from './api/manageUsersApi'
import { TokenVerificationApi, tokenVerificationApiFactory } from './api/tokenVerificationApi'
import { NomisUsersAndRolesApi, nomisUsersAndRolesFactory } from './api/nomisUsersAndRolesApi'
import { oauthEnabledClientFactory } from './api/oauthEnabledClient'

const oauthApi: OAuthApi = oauthApiFactory({
  apiClientId: config.apis.hmppsAuth.apiClientId,
  apiClientSecret: config.apis.hmppsAuth.apiClientSecret,
  url: config.apis.hmppsAuth.url,
})

const manageUsersApi: ManageUsersApi = manageUsersApiFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.manageUsers.url,
    timeout: config.apis.manageUsers.timeout.response,
  }),
)

const tokenVerificationApi: TokenVerificationApi = tokenVerificationApiFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.tokenVerification.url,
    timeout: config.apis.tokenVerification.timeoutSeconds * 1000,
  }),
)

const nomisUsersAndRolesApi: NomisUsersAndRolesApi = nomisUsersAndRolesFactory(
  oauthEnabledClientFactory({
    baseUrl: config.apis.nomisUsersAndRoles.url,
    timeout: config.apis.nomisUsersAndRoles.timeoutSeconds * 1000,
  }),
)

export { oauthApi, manageUsersApi, tokenVerificationApi, nomisUsersAndRolesApi }
