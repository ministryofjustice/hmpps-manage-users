/** @type {any} */
import { oauthApiFactory } from "./oauthApi";
import nock from "nock";
import {OAuthEnabledClient} from "./oauthEnabledClient";

const apiClientId = 'clientId'
const url = 'http://localhost'
const apiClientSecret = 'clientSecret'

const client: OAuthEnabledClient = {
    get: jest.fn(),
    getWithCustomTimeout: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    del: jest.fn(),
    getStream: jest.fn(),
}
const oauthApi = oauthApiFactory({ url, apiClientId, apiClientSecret })
const mock = nock(url, { reqheaders: { 'Content-Type': 'application/x-www-form-urlencoded' } })

describe('oauthApi tests', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('refresh', () => {
    it('should save access token', async () => {
      mock
        .post('/oauth/token', { grant_type: 'refresh_token', refresh_token: 'refreshToken' })
        .basicAuth({ user: apiClientId, pass: apiClientSecret })
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
