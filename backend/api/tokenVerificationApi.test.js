const MockAdapter = require('axios-mock-adapter')

const clientFactory = require('./oauthEnabledClient')
const { tokenVerificationApiFactory } = require('./tokenVerificationApi')
const config = require('../config')

const hostname = 'http://localhost:8080'

describe('token verification api tests', () => {
  const client = clientFactory({ baseUrl: `${hostname}`, timeout: 2000 })
  const tokenVerificationApi = tokenVerificationApiFactory(client)
  const mock = new MockAdapter(client.axiosInstance)

  afterEach(() => {
    mock.reset()
  })

  describe('POST requests', () => {
    describe('Token Verification disabled', () => {
      beforeAll(() => {
        config.apis.tokenverification.enabled = false
      })
      it('Calls verify and parses response', async () => {
        mock.onPost('/token/verify').reply(200, { active: true })
        const data = await tokenVerificationApi.verifyToken({})
        expect(data).toEqual(true)
      })
    })
    describe('Token Verification enabled', () => {
      beforeEach(() => {
        config.apis.tokenverification.enabled = true
      })
      it('Calls verify and parses response', async () => {
        mock.onPost('/token/verify').reply(200, { active: true })
        const data = await tokenVerificationApi.verifyToken({})
        expect(data).toEqual(true)
      })
      it('Calls verify and parses inactive response', async () => {
        mock.onPost('/token/verify').reply(200, { active: false })
        const data = await tokenVerificationApi.verifyToken({})
        expect(data).toEqual(false)
      })
      it('Calls verify and parses no response', async () => {
        mock.onPost('/token/verify').reply(200, {})
        const data = await tokenVerificationApi.verifyToken({})
        expect(data).toEqual(false)
      })
    })
  })
})
