const currentUser = require('./currentUser')

describe('Current user', () => {
  const oauthApi = {}
  const nomisUsersAndRolesApi = {}
  let req
  let res

  beforeEach(() => {
    oauthApi.currentUser = jest.fn()
    oauthApi.currentRoles = jest.fn()
    nomisUsersAndRolesApi.userCaseLoads = jest.fn()

    oauthApi.currentUser.mockReturnValue({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }])
    nomisUsersAndRolesApi.userCaseLoads.mockReturnValue({
      username: 'user',
      activeCaseload: { id: 'MDI', name: 'Moorland' },
      caseloads: [
        { id: 'MDI', name: 'Moorland' },
        { id: 'LEI', name: 'Leeds' },
      ],
    })

    req = { session: {}, protocol: 'http', originalUrl: '/somethingelse', get: jest.fn() }
    res = { locals: {} }
  })

  it('should request and store user details', async () => {
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })
    await controller(req, res, () => {})

    expect(oauthApi.currentUser).toHaveBeenCalled()
    expect(oauthApi.currentRoles).toHaveBeenCalled()
    expect(req.session.userDetails).toEqual({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })

  it('should stash data into res.locals', async () => {
    req.get.mockReturnValue('host')
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(res.locals.user).toEqual({
      allCaseloads: [
        {
          id: 'MDI',
          name: 'Moorland',
        },
        {
          id: 'LEI',
          name: 'Leeds',
        },
      ],
      activeCaseLoad: {
        id: 'MDI',
        name: 'Moorland',
      },
      displayName: 'B. Smith',
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      clientID: 'manage-user-accounts-ui',
      returnUrl: 'http://host/somethingelse',
    })
  })

  it('should set group manager', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'AUTH_GROUP_MANAGER' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: true,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })

  it('should set maintain access', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: true,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })

  it('should set maintain access admin', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: true,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })

  it('should set Search for an external user', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_OAUTH_USERS' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: true,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })

  it('should set create dps user', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'CREATE_USER' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: true,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
    })
  })
  it('should set maintain dps user', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: false,
      manageDPSUserAccount: true,
    })
  })

  it('should set Role admin for an external user', async () => {
    oauthApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'ROLES_ADMIN' }])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainRoles: true,
      manageDPSUserAccount: false,
    })
  })

  it('should set all roles', async () => {
    oauthApi.currentRoles.mockReturnValue([
      { roleCode: 'FRED' },
      { roleCode: 'MAINTAIN_OAUTH_USERS' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' },
      { roleCode: 'AUTH_GROUP_MANAGER' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES' },
      { roleCode: 'ROLES_ADMIN' },
      { roleCode: 'CREATE_USER' },
      { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' },
    ])
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: true,
      groupManager: true,
      maintainAccess: true,
      maintainAccessAdmin: true,
      maintainAuthUsers: true,
      maintainRoles: true,
      manageDPSUserAccount: true,
    })
  })

  it('ignore xhr requests', async () => {
    const controller = currentUser({ oauthApi, nomisUsersAndRolesApi })
    req.xhr = true

    const next = jest.fn()

    await controller(req, res, next)

    expect(oauthApi.currentUser.mock.calls.length).toEqual(0)
    expect(oauthApi.currentRoles.mock.calls.length).toEqual(0)
    expect(next).toHaveBeenCalled()
  })
})
