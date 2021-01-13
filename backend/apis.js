const config = require('./config')
const clientFactory = require('./api/oauthEnabledClient')
const { prisonApiFactory } = require('./api/prisonApi')
const { oauthApiFactory } = require('./api/oauthApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')

const prisonApi = prisonApiFactory(
  clientFactory({
    baseUrl: config.apis.prison.url,
    timeout: config.apis.prison.timeoutSeconds * 1000,
  }),
)

const oauthApi = oauthApiFactory(
  clientFactory({
    baseUrl: config.apis.oauth2.url,
    timeout: config.apis.oauth2.timeoutSeconds * 1000,
  }),
  { ...config.apis.oauth2 },
)

const tokenVerificationApi = tokenVerificationApiFactory(
  clientFactory({
    baseUrl: config.apis.tokenverification.url,
    timeout: config.apis.tokenverification.timeoutSeconds * 1000,
  }),
)

module.exports = {
  prisonApi,
  oauthApi,
  tokenVerificationApi,
}
