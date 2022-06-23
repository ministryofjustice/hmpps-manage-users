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
    oauthApi: { getUserEmail: jest.fn(), syncDpsEmail: jest.fn() },
    nomisUsersAndRolesApi: { getUser: jest.fn() },
    manageUsersApi: { contextUserRoles: jest.fn() },
  }
  const router = manageDpsUserRouter(apis)
  // @ts-ignore
  const getUserAndRolesApi = router.get.mock.calls[1][1]
  // @ts-ignore
  const getUserApi = router.get.mock.calls[2][1]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserAndRolesApi', () => {
    it('should map the email info onto the user', async () => {
      apis.nomisUsersAndRolesApi.getUser.mockResolvedValue({
        username: 'joe',
        active: true,
        primaryEmail: 'joe@nomis',
      })
      apis.manageUsersApi.contextUserRoles.mockResolvedValue({ username: 'joe', dpsRoles: [{ code: 'role1' }] })
      apis.oauthApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@auth', verified: false })
      const context = { user: 'bob' }
      const results = await getUserAndRolesApi({ locals: context }, 'joe')
      expect(results).toEqual([
        {
          username: 'joe',
          active: true,
          primaryEmail: 'joe@nomis',
          email: 'joe@nomis',
          emailToVerify: 'joe@auth',
          verified: false,
        },
        [{ roleCode: 'role1' }],
      ])
      expect(apis.oauthApi.syncDpsEmail).toBeCalledWith({ locals: context }, 'joe')
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
