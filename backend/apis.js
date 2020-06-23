const config = require('./config')
const clientFactory = require('./api/oauthEnabledClient')
const { elite2ApiFactory } = require('./api/elite2Api')
const { oauthApiFactory } = require('./api/oauthApi')
const { tokenVerificationApiFactory } = require('./api/tokenVerificationApi')

const elite2Api = elite2ApiFactory(
  clientFactory({
    baseUrl: config.apis.elite2.url,
    timeout: config.apis.elite2.timeoutSeconds * 1000,
  })
)

const oauthApi = oauthApiFactory(
  clientFactory({
    baseUrl: config.apis.oauth2.url,
    timeout: config.apis.oauth2.timeoutSeconds * 1000,
  }),
  { ...config.apis.oauth2 }
)

const tokenVerificationApi = tokenVerificationApiFactory(
  clientFactory({
    baseUrl: config.apis.tokenverification.url,
    timeout: config.apis.tokenverification.timeoutSeconds * 1000,
  })
)

module.exports = {
  elite2Api,
  oauthApi,
  tokenVerificationApi,
}
