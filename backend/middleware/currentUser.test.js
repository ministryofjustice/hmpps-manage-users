const currentUser = require('./currentUser')

describe('Current user', () => {
  const manageUsersApi = {}
  let req
  let res

  beforeEach(() => {
    manageUsersApi.currentUser = jest.fn()
    manageUsersApi.currentRoles = jest.fn()
    manageUsersApi.currentUserCaseloads = jest.fn()

    manageUsersApi.currentUser.mockReturnValue({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }])
    manageUsersApi.currentUserCaseloads.mockReturnValue({
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
    const controller = currentUser({ manageUsersApi })
    await controller(req, res, () => {})

    expect(manageUsersApi.currentUser).toHaveBeenCalled()
    expect(manageUsersApi.currentRoles).toHaveBeenCalled()
    expect(req.session.userDetails).toEqual({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should stash data into res.locals', async () => {
    req.get.mockReturnValue('host')
    const controller = currentUser({ manageUsersApi })

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
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
      clientID: 'manage-user-accounts-ui',
      returnUrl: 'http://host/somethingelse',
    })
  })

  it('should set group manager', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'AUTH_GROUP_MANAGER' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: true,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set maintain access', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: true,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set maintain access admin', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: true,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set Search for an external user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_OAUTH_USERS' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: true,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set create dps user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'CREATE_USER' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: true,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })
  it('should set maintain dps user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: true,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set Role admin for an external user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'ROLES_ADMIN' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: true,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: true,
    })
  })

  it('should set Role manage email domains for an external user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MAINTAIN_EMAIL_DOMAINS' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: true,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set Role manage user allow list for an external user', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'FRED' }, { roleCode: 'MANAGE_USER_ALLOW_LIST' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: true,
      viewAdministrableUserRoles: false,
    })
  })

  it('should set all roles', async () => {
    manageUsersApi.currentRoles.mockReturnValue([
      { roleCode: 'FRED' },
      { roleCode: 'MAINTAIN_OAUTH_USERS' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN' },
      { roleCode: 'AUTH_GROUP_MANAGER' },
      { roleCode: 'MAINTAIN_ACCESS_ROLES' },
      { roleCode: 'ROLES_ADMIN' },
      { roleCode: 'CREATE_USER' },
      { roleCode: 'MANAGE_NOMIS_USER_ACCOUNT' },
      { roleCode: 'MAINTAIN_EMAIL_DOMAINS' },
    ])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: true,
      groupManager: true,
      maintainAccess: true,
      maintainAccessAdmin: true,
      maintainAuthUsers: true,
      maintainOAuthAdmin: false,
      maintainRoles: true,
      manageDPSUserAccount: true,
      manageEmailDomains: true,
      manageUserAllowList: false,
      viewAdministrableUserRoles: true,
    })
  })

  it('should set view user roles', async () => {
    manageUsersApi.currentRoles.mockReturnValue([{ roleCode: 'VIEW_ADMINISTRABLE_USER_ROLES' }])
    const controller = currentUser({ manageUsersApi })

    await controller(req, res, () => {})

    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: true,
    })
  })

  it('should not ignore xhr requests', async () => {
    const controller = currentUser({ manageUsersApi })
    req.xhr = true

    const next = jest.fn()

    await controller(req, res, next)

    expect(manageUsersApi.currentUser).toHaveBeenCalled()
    expect(manageUsersApi.currentRoles).toHaveBeenCalled()
    expect(req.session.userDetails).toEqual({ name: 'Bob Smith', activeCaseLoadId: 'MDI' })
    expect(req.session.userRoles).toEqual({
      createDPSUsers: false,
      groupManager: false,
      maintainAccess: false,
      maintainAccessAdmin: false,
      maintainAuthUsers: false,
      maintainOAuthAdmin: false,
      maintainRoles: false,
      manageDPSUserAccount: false,
      manageEmailDomains: false,
      manageUserAllowList: false,
      viewAdministrableUserRoles: false,
    })
    expect(next).toHaveBeenCalled()
  })
})
