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

  describe('getUser', () => {
    const userDetails = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userDetails,
      })
      actual = oauthApi.getUser(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(userDetails)
    })
    it('should call external user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/api/authuser/id/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })

  describe('getUserEmail', () => {
    const emailDetails = { email: 'hello@there', username: 'someuser' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => emailDetails,
      })
    })

    it('should return email from endpoint', async () => {
      const actual = await oauthApi.getUserEmail(context, { username: 'joe' })
      expect(actual).toEqual(emailDetails)
    })
    it('should call user email endpoint', () => {
      oauthApi.getUserEmail(context, { username: 'joe' })
      expect(client.get).toBeCalledWith(context, '/api/user/joe/email?unverified=true')
    })
    it('should cope with not found from endpoint', async () => {
      const error = { ...new Error('User not found'), status: 404 }
      client.get.mockRejectedValue(error)
      const actual = await oauthApi.getUserEmail(context, { username: 'joe' })
      expect(actual).toEqual({})
    })
    it('should rethrow other errors', async () => {
      const error = new Error('User not found')
      client.get.mockRejectedValue(error)
      expect(async () => oauthApi.getUserEmail(context, { username: 'joe' })).rejects.toThrow(error)
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

  describe('currentUser', () => {
    const userDetails = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userDetails,
      })
      actual = oauthApi.currentUser(context)
    })

    it('should return user details from endpoint', () => {
      expect(actual).toEqual(userDetails)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/api/user/me')
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
