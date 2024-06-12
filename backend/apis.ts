import config from './config'
import { oauthApiFactory, OAuthApi } from './api/oauthApi'
import { manageUsersApiFactory, ManageUsersApi } from './api/manageUsersApi'
import { tokenVerificationApiFactory, TokenVerificationApi } from './api/tokenVerificationApi'
import { oauthEnabledClientFactory } from './api/oauthEnabledClient'

export interface ApiList {
  oauthApi: OAuthApi
  manageUsersApi: ManageUsersApi
  tokenVerificationApi: TokenVerificationApi
}

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

const apiList: ApiList = {
  oauthApi,
  manageUsersApi,
  tokenVerificationApi,
}

export default apiList
