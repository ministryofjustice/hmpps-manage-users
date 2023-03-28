/** @type {any} */
const nock = require('nock')
const { oauthApiFactory } = require('./oauthApi')

const clientId = 'clientId'
const url = 'http://localhost'
const clientSecret = 'clientSecret'

const client = {}
const oauthApi = oauthApiFactory(client, { url, clientId, clientSecret })
const mock = nock(url, { reqheaders: { 'Content-Type': 'application/x-www-form-urlencoded' } })
const context = { some: 'context' }

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

  describe('userEmails', () => {
    const emailDetails = [{ email: 'hello@there', username: 'someuser' }]
    let actual

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => emailDetails,
      })
      actual = oauthApi.userEmails(context, ['joe', 'fred'])
    })

    it('should return email from endpoint', () => {
      expect(actual).toEqual(emailDetails)
    })
    it('should call user emails endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/api/user/email', ['joe', 'fred'])
    })
  })

  describe('createUser', () => {
    const user = { user: { email: 'joe@digital.justice.gov.uk', firstName: 'joe', lastName: 'smith' } }

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => {},
      })
      oauthApi.createUser(context, user)
    })

    it('should call external user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/api/authuser/create', user)
    })
  })
})
