const { userMeFactory } = require('./userMe')

const caseloads = [{ caseLoadId: 'LEI', currentlyActive: true }]
const staff1 = {
  staffId: 1,
  username: 'staff1',
}

describe('userMe controller', () => {
  const elite2Api = {
    userCaseLoads: () => {},
  }
  const oauthApi = {
    currentUser: () => {},
    currentRoles: () => {},
  }
  const { userMeService } = userMeFactory(oauthApi, elite2Api)
  const req = {}
  const res = { locals: {} }

  beforeEach(() => {
    elite2Api.userCaseLoads = jest.fn()
    oauthApi.currentUser = jest.fn()
    oauthApi.currentRoles = jest.fn()

    oauthApi.currentUser.mockImplementation(() => staff1)
    oauthApi.currentRoles.mockImplementation(() => [])
    elite2Api.userCaseLoads.mockImplementation(() => caseloads)
    res.json = jest.fn()
  })

  describe('access checks', () => {
    const defaultUserMe = {
      ...staff1,
      activeCaseLoadId: 'LEI',
      prisonMigrated: true,
      maintainAccess: false,
      maintainAccessAdmin: false,
      migration: false,
      writeAccess: false,
      maintainAuthUsers: false,
      groupManager: false,
      keyWorkerMonitor: false,
    }

    it('should default to no access if user has no roles', async () => {
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
      })
    })
    it('should have writeAccess when the user has the key worker admin role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'OMIC_ADMIN' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        writeAccess: true,
      })
    })
    it('should not have writeAccess when the prison has not been migrated regardless of roles', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'OMIC_ADMIN' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        writeAccess: false,
        prisonMigrated: false,
      })
    })
    it('should have migration when the user has the keyworker migration role', async () => {
      oauthApi.currentRoles.mockImplementation(() => [{ roleCode: 'KW_MIGRATION' }])
      await userMeService(req, res)

      expect(res.json.mock.calls[0][0]).toEqual({
        ...defaultUserMe,
        migration: true,
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
        keyWorkerMonitor: true,
        migration: true,
        writeAccess: true,
        maintainAuthUsers: true,
      })
    })
  })
})
