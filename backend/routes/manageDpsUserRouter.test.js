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
  const apis = {
    oauthApi: { getUserEmail: jest.fn() },
    nomisUsersAndRolesApi: { getUser: jest.fn(), contextUserRoles: jest.fn() },
  }
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
      apis.nomisUsersAndRolesApi.getUser.mockResolvedValue({ username: 'joe', active: true })
      apis.nomisUsersAndRolesApi.contextUserRoles.mockResolvedValue({ username: 'joe', dpsRoles: [{ code: 'role1' }] })
      apis.oauthApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@bloggs', verified: false })
      const context = { user: 'bob' }
      const results = await getUserAndRolesApi({ locals: context })
      expect(results).toEqual([
        { username: 'joe', active: true, email: 'joe@bloggs', verified: false },
        [{ code: 'role1' }],
      ])
    })
  })
  describe('getUserApi', () => {
    it('should map the email info onto the user', async () => {
      apis.nomisUsersAndRolesApi.getUser.mockResolvedValue({ username: 'joe', active: true })
      apis.oauthApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@bloggs', verified: false })
      const context = { user: 'bob' }
      const results = await getUserApi({ locals: context })
      expect(results).toEqual({ username: 'joe', active: true, email: 'joe@bloggs' })
    })
  })
})
