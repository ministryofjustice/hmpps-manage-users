const { userMeFactory } = require('./userMe')

const staff1 = {
  staffId: 1,
  username: 'staff1',
}

describe('userMe controller', () => {
  const oauthApi = {
    currentUser: () => {},
    currentRoles: () => {},
  }
  const { userMeService } = userMeFactory(oauthApi)
  const req = {}
  const res = { locals: {} }

  beforeEach(() => {
    oauthApi.currentUser = jest.fn()
    oauthApi.currentRoles = jest.fn()

    oauthApi.currentUser.mockImplementation(() => staff1)
    oauthApi.currentRoles.mockImplementation(() => [])
    res.json = jest.fn()
  })

  describe('access checks', () => {
    const defaultUserMe = {
      ...staff1,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      groupManager: false,
    }

    it('should default to no access if user has no roles', async () => {
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
      })
    })
    it('should have maintainAccess when the user has the maintain access roles role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'MAINTAIN_ACCESS_ROLES' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        maintainAccess: true,
      })
    })
    it('should have maintainAccessAdmin when the user has the maintain access roles admin role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        maintainAccessAdmin: true,
      })
    })
    it('should have maintainAuthUsers when the user has the maintain auth users role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'MAINTAIN_OAUTH_USERS' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        maintainAuthUsers: true,
      })
    })
    it('should have groupManager when the user has the group manager role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'AUTH_GROUP_MANAGER' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        groupManager: true,
      })
    })
    it('should give full access when user has all roles', async () => {
      oauthApi.currentRoles.mockImplementation(() => [
        { roleCode: 'MAINTAIN_OAUTH_USERS' },
        { roleCode: 'MAINTAIN_ACCESS_ROLES' },
        { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' },
      ])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        maintainAccess: true,
        maintainAccessAdmin: true,
        maintainAuthUsers: true,
      })
    })
  })
})
