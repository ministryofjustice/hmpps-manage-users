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
    manageUsersApi: {
      syncDpsEmail: jest.fn(),
      contextUserRoles: jest.fn(),
      getDpsUser: jest.fn(),
      getUserEmail: jest.fn(),
      getUserCaseloads: jest.fn(),
    },
  }
  const router = manageDpsUserRouter(apis)
  // @ts-ignore
  const getUserRolesAndCaseloadsApi = router.get.mock.calls[2][1]
  // @ts-ignore
  const getUserApi = router.get.mock.calls[3][1]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserRolesAndCaseloadsApi', () => {
    it('should map the email info onto the user', async () => {
      apis.manageUsersApi.getDpsUser.mockResolvedValue({
        username: 'joe',
        active: true,
        primaryEmail: 'joe@nomis',
      })
      apis.manageUsersApi.contextUserRoles.mockResolvedValue({
        username: 'joe',
        dpsRoles: [{ code: 'role1' }],
        activeCaseload: { id: 'MDI', name: 'Moorland' },
      })
      apis.manageUsersApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@auth', verified: false })
      apis.manageUsersApi.getUserCaseloads.mockResolvedValue({
        caseloads: [
          { id: 'MDI', name: 'Moorland' },
          { id: 'PVI', name: 'Pentonville' },
        ],
      })
      const context = { user: 'bob' }
      const results = await getUserRolesAndCaseloadsApi({ locals: context }, 'joe')
      expect(results).toEqual([
        {
          username: 'joe',
          active: true,
          primaryEmail: 'joe@nomis',
          email: 'joe@nomis',
          emailToVerify: 'joe@auth',
          verified: false,
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland',
          },
        },
        [{ roleCode: 'role1' }],
        undefined,
        [
          { id: 'MDI', name: 'Moorland' },
          { id: 'PVI', name: 'Pentonville' },
        ],
      ])
      expect(apis.manageUsersApi.syncDpsEmail).toHaveBeenCalledWith({ locals: context }, 'joe')
    })
  })

  describe('getUserApi', () => {
    it('should map the email info onto the user', async () => {
      apis.manageUsersApi.getDpsUser.mockResolvedValue({ username: 'joe', active: true })
      apis.manageUsersApi.getUserEmail.mockResolvedValue({ username: 'joe', email: 'joe@bloggs', verified: false })
      const context = { user: 'bob' }
      const results = await getUserApi({ locals: context })
      expect(results).toEqual({ username: 'joe', active: true, email: 'joe@bloggs' })
    })
  })
})
