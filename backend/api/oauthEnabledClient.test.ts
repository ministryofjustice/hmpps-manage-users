import nock from 'nock'
import * as contextProperties from '../contextProperties'
import { oauthEnabledClientFactory } from './oauthEnabledClient'
import { Context } from '../interfaces/context'

const hostname = 'http://localhost:8080'

describe('Test clients built by oauthEnabledClient', () => {
  it('should build something', () => {
    const client = oauthEnabledClientFactory({ baseUrl: `${hostname}/`, timeout: 2000 })
    expect(client).not.toBeNull()
  })

  describe('Assert client behaviour', () => {
    const client = oauthEnabledClientFactory({ baseUrl: `${hostname}/`, timeout: 2000 })
    const getRequest = nock(hostname)

    beforeEach(() => {
      getRequest.get('/api/users/me').reply(200, {})
    })

    afterEach(() => {
      nock.cleanAll()
    })

    it('Should set the authorization header with "Bearer <access token>"', async () => {
      const context: Context = {}
      contextProperties.setTokens({ access_token: 'a', refresh_token: 'b', authSource: 'joe' }, context)

      const response = await client.get(context, '/api/users/me')

      expect(response.status).toEqual(200)
      expect(response.request.header.authorization).toEqual('Bearer a')
    })

    it('Should succeed when there are no authorization headers', async () => {
      const response = await client.get({}, '/api/users/me')
      expect(response.request.header.authorization).toBeUndefined()
    })

    it('Should set the pagination headers on requests', async () => {
      const context: Context = {}
      contextProperties.setRequestPagination(context, { offset: '0', size: '10' })

      const response = await client.get(context, '/api/users/me')

      expect(response.request.header).toEqual(expect.objectContaining({ 'page-offset': 0, 'page-limit': 10 }))
    })

    it('Should set the results limit header override on requests', async () => {
      const context: Context = {}
      contextProperties.setRequestPagination(context, { offset: '0', size: '10' })

      const response = await client.get(context, '/api/users/me', 500)

      expect(response.request.header).toEqual(expect.objectContaining({ 'page-offset': 0, 'page-limit': 500 }))
    })
  })

  describe('retry and timeout behaviour', () => {
    const client = oauthEnabledClientFactory({ baseUrl: `${hostname}/`, timeout: 900 })
    const mock = nock(hostname)

    afterEach(() => {
      nock.cleanAll()
    })

    describe('get', () => {
      it('Should retry twice if request fails', async () => {
        mock
          .get('/api/users/me')
          .reply(500, { failure: 'one' })
          .get('/api/users/me')
          .reply(500, { failure: 'two' })
          .get('/api/users/me')
          .reply(200, { hi: 'bob' })

        const response = await client.get({}, '/api/users/me')
        expect(response.body).toEqual({ hi: 'bob' })
      })

      it('Should retry twice if request times out', async () => {
        mock
          .get('/api/users/me')
          .delay(10000) // delay set to 10s, timeout to 900/3=300ms
          .reply(200, { failure: 'one' })
          .get('/api/users/me')
          .delay(10000)
          .reply(200, { failure: 'two' })
          .get('/api/users/me')
          .reply(200, { hi: 'bob' })

        const response = await client.get({}, '/api/users/me')
        expect(response.body).toEqual({ hi: 'bob' })
      })

      it('Should fail if request times out three times', async () => {
        mock
          .get('/api/users/me')
          .delay(10000) // delay set to 10s, timeout to 900/3=300ms
          .reply(200, { failure: 'one' })
          .get('/api/users/me')
          .delay(10000)
          .reply(200, { failure: 'two' })
          .get('/api/users/me')
          .delay(10000)
          .reply(200, { failure: 'three' })

        await expect(client.get({}, '/api/users/me')).rejects.toThrow('Timeout of 300ms exceeded')
      })
    })
  })

  describe('Normalise base url behaviour', () => {
    afterEach(() => {
      nock.cleanAll()
    })

    it('Should set the url correctly if ends with a /', async () => {
      const client = oauthEnabledClientFactory({ baseUrl: `${hostname}/`, timeout: 2000 })
      nock(hostname).get('/api/users/me').reply(200, {})

      const context = {}
      contextProperties.setTokens({ access_token: 'a', refresh_token: 'b', authSource: null }, context)

      const response = await client.get(context, '/api/users/me')

      expect(response.request.url).toEqual('http://localhost:8080/api/users/me')
    })

    it("Should set the url correctly if doesn't end with a /", async () => {
      const client = oauthEnabledClientFactory({ baseUrl: hostname, timeout: 2000 })
      nock(hostname).get('/api/users/me').reply(200, {})

      const context = {}
      contextProperties.setTokens({ access_token: 'a', refresh_token: 'b', authSource: null }, context)

      const response = await client.get(context, '/api/users/me')

      expect(response.request.url).toEqual('http://localhost:8080/api/users/me')
    })
  })
})
