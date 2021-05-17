jest.mock('express', () => ({
  Router: () => ({ get: jest.fn(), post: jest.fn() }),
}))
jest.mock('../controllers/changeEmail', () => ({
  changeEmailFactory: jest.fn((getUserApi) => ({ index: getUserApi })),
}))
jest.mock('../controllers/userDetails', () => ({
  userDetailsFactory: jest.fn((getUserAndRolesApi) => ({ index: getUserAndRolesApi })),
}))
const manageDpsUserRouter = require('./manageDpsUserRouter')

describe('Manage DPS user router', () => {
  const apis = { prisonApi: { getUser: jest.fn(), contextUserRoles: jest.fn() }, oauthApi: { getUserEmail: jest.fn() } }
  const router = manageDpsUserRouter(apis)
  // @ts-ignore
  const getUserAndRolesApi = router.get.mock.calls[2][1]
  // @ts-ignore
  const getUserApi = router.get.mock.calls[3][1]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserAndRolesApi', () => {
    it('should map the email info onto the user', async () => {
      apis.prisonApi.getUser.mockResolvedValue({ username: 'joe', status: 'active' })
      apis.prisonApi.contextUserRoles.mockResolvedValue({ role: 'orle' })
      apis.oauthApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@bloggs', verified: false })
      const context = { user: 'bob' }
      const results = await getUserAndRolesApi({ locals: context })
      expect(results).toEqual([
        { username: 'joe', status: 'active', email: 'joe@bloggs', verified: false },
        { role: 'orle' },
      ])
    })
  })
  describe('getUserApi', () => {
    it('should map the email info onto the user', async () => {
      apis.prisonApi.getUser.mockResolvedValue({ username: 'joe', status: 'active' })
      apis.oauthApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@bloggs', verified: false })
      const context = { user: 'bob' }
      const results = await getUserApi({ locals: context })
      expect(results).toEqual({ username: 'joe', status: 'active', email: 'joe@bloggs' })
    })
  })
})
