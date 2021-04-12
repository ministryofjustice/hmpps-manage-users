const searchDpsUserRouter = require('./searchDpsUserRouter')

jest.mock('express', () => ({
  Router: () => ({ get: jest.fn(), post: jest.fn() }),
}))
jest.mock('../controllers/search', () => ({
  searchFactory: jest.fn((a, b, c, searchApi) => ({ index: searchApi })),
}))

describe('Search DPS user router', () => {
  const apis = { prisonApi: { userSearch: jest.fn(), userSearchAdmin: jest.fn() }, oauthApi: { userEmails: jest.fn() } }
  const router = searchDpsUserRouter(apis)
  // @ts-ignore
  const searchApi = router.get.mock.calls[0][1]

  describe('searchApi', () => {
    it('should map the search results', async () => {
      apis.prisonApi.userSearch.mockResolvedValue([
        { username: 'joe', status: 'active' },
        { username: 'fred' },
        { username: 'harry', other: 'field' },
      ])
      apis.oauthApi.userEmails.mockResolvedValue([
        { username: 'joe', email: 'joe@bloggs' },
        { username: 'harry', email: 'harry@bloggs' },
      ])
      const results = await searchApi({})
      expect(results).toEqual([
        { username: 'joe', status: 'active', email: 'joe@bloggs' },
        { username: 'fred', email: undefined },
        { username: 'harry', other: 'field', email: 'harry@bloggs' },
      ])
    })
    it('should call admin version if maintain access', async () => {
      apis.prisonApi.userSearchAdmin.mockResolvedValue([{ username: 'joey', status: 'active' }])
      apis.oauthApi.userEmails.mockResolvedValue([{ username: 'joey', email: 'joey@bloggs' }])
      const results = await searchApi({ locals: { user: { maintainAccessAdmin: true } } })
      expect(results).toEqual([{ username: 'joey', status: 'active', email: 'joey@bloggs' }])
    })
  })
})
