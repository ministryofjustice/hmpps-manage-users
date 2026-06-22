import nock from 'nock'
import path from 'path'
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

      expect(response.request.header).toEqual(expect.objectContaining({ 'page-offset': 0, 'page-limit': '500' }))
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

  describe('Post Multipart request', () => {
    const client = oauthEnabledClientFactory({ baseUrl: `${hostname}/`, timeout: 2000 })
    const fileInfo = {
      filename: 'valid-users.csv',
      path: path.join(__dirname, '..', '..', 'fixtures', 'bulkUserRoles', 'valid-users.csv'),
    }
    const multipartRequest = nock(hostname)
    const context = {}
    const bulkUserRolesAdditionsReq = { jiraReference: '1234567890', roles: ['ROLE_1', 'ROLE_2'] }
    let capturedBody: string | undefined

    beforeEach(() => {
      capturedBody = undefined
    })

    afterEach(() => {
      nock.cleanAll()
    })

    const captureRequestBody = (returnId: string) => {
      return multipartRequest
        .matchHeader('content-type', (value) => value.startsWith('multipart/form-data;'))
        .post('/bulk-jobs/user-role-additions', (body) => {
          capturedBody = body
          return true
        })
        .reply(200, { id: returnId })
    }

    it('should post multipart upload form data with json request body', async () => {
      const scope = captureRequestBody('666')

      const resp = await client.postMultipartData(
        context,
        '/bulk-jobs/user-role-additions',
        bulkUserRolesAdditionsReq,
        fileInfo.path,
        fileInfo.filename,
      )

      expect(scope.isDone()).toBe(true)
      expect(resp.statusCode).toBe(200)
      expect(resp.body).toEqual({ id: '666' })
      expect(capturedBody).toContain('Content-Disposition: form-data; name="userCsv"; filename="valid-users.csv"')
      expect(capturedBody).toContain('Content-Type: text/csv')
      expect(capturedBody).toContain('userId\nX123456\nY999999')
      expect(capturedBody).toContain('Content-Disposition: form-data; name="bulkJobDetails"')
      expect(capturedBody).toContain(JSON.stringify(bulkUserRolesAdditionsReq))
    })

    it('should reject with error if file not found', async () => {
      const scope = captureRequestBody('666')

      await expect(
        client.postMultipartData(
          context,
          '/bulk-jobs/user-role-additions',
          bulkUserRolesAdditionsReq,
          '/madeup/path',
          'valid-users.csv',
        ),
      ).rejects.toThrow('ENOENT')

      expect(scope.isDone()).toBe(false)
    })
  })
})
