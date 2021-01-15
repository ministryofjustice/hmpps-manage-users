const currentUser = require('./currentUser')

describe('Current user', () => {
  const oauthApi = {}
  const prisonApi = {}
  let req
  let res

  beforeEach(() => {
    oauthApi.currentUser = jest.fn()
    oauthApi.currentRoles = jest.fn()
    prisonApi.userCaseLoads = jest.fn()

    oauthApi.currentUser.mockReturnValue({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }])
    prisonApi.userCaseLoads.mockReturnValue([{ caseLoadId: 'MDI', description: 'Moorland' }])

    req = { session: {} }
    res = { locals: {} }
  })

  it('should request and store user details', async () => {
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(oauthApi.currentUser).toHaveBeenCalled()
    expect(oauthApi.currentRoles).toHaveBeenCalled()
    expect(req.session.userDetails).toEqual({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    expect(req.session.userRoles).toEqual({
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
    })
  })

  it('should stash data into res.locals', async () => {
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(res.locals.user).toEqual({
      allCaseloads: [
        {
          caseLoadId: 'MDI',
          description: 'Moorland',
        },
      ],
      activeCaseLoad: {
        caseLoadId: 'MDI',
        description: 'Moorland',
      },
      displayName: 'B. Smith',
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
    })
  })

  it('should set group manager', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'AUTH_GROUP_MANAGER' }])
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      groupManager: true,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
    })
  })

  it('should set maintain access', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES' }])
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      groupManager: false,
      maintainAccess: true,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
    })
  })

  it('should set maintain access admin', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: true,
      maintainAuthUsers: false,
    })
  })

  it('should set Search for an external user', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_OAUTH_USERS' }])
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: true,
    })
  })

  it('should set all roles', async () => {
    oauthApi.currentRoles.mockReturnValue([
      { roleCode: 'FRED' },
      { roleCode: 'MAINTAIN_OAUTH_USERS' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' },
      { roleCode: 'AUTH_GROUP_MANAGER' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES' },
    ])
    const controller = currentUser({ prisonApi, oauthApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      groupManager: true,
      maintainAccess: true,
      maintainAccessAdmin: true,
      maintainAuthUsers: true,
    })
  })

  it('ignore xhr requests', async () => {
    const controller = currentUser({ prisonApi, oauthApi })
    req.xhr = true

    const next = jest.fn()

    await controller(req, res, next)

    expect(oauthApi.currentUser.mock.calls.length).toEqual(0)
    expect(oauthApi.currentRoles.mock.calls.length).toEqual(0)
    expect(next).toHaveBeenCalled()
  })
})
