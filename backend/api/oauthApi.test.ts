/** @type {any} */
import nock from 'nock'
import { oauthApiFactory } from './oauthApi'

const clientId = 'clientId'
const url = 'http://localhost'
const clientSecret = 'clientSecret'

const oauthApi = oauthApiFactory({
  url,
  apiClientId: clientId,
  apiClientSecret: clientSecret,
})
const mock = nock(url, { reqheaders: { 'Content-Type': 'application/x-www-form-urlencoded' } })

describe('oauthApi tests', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('refresh', () => {
    it('should save access token', async () => {
      mock
        .post('/oauth/token', { grant_type: 'refresh_token', refresh_token: 'refreshToken' })
        .basicAuth({ user: clientId, pass: clientSecret })
        .reply(200, {
          token_type: 'bearer',
          expires_in: 59,
          scope: 'write',
          internalUser: true,
          jti: 'bf5e8f62-1d2a-4126-96e2-a4ae91997ba6',
          access_token: 'newAccessToken',
          refresh_token: 'newRefreshToken',
        })
      const response = await oauthApi.refresh('refreshToken')
      expect(response.access_token).toEqual('newAccessToken')
      expect(response.refresh_token).toEqual('newRefreshToken')
    })
  })
})
