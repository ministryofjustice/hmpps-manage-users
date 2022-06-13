const { userDetailsFactory } = require('./userDetails')

describe('user detail factory', () => {
  const defaultSearchUrl = '/search-external-users'
  const render = jest.fn()
  const getUserRolesAndGroupsApi = jest.fn()
  const removeRoleApi = jest.fn()
  const removeGroupApi = jest.fn()
  const enableUserApi = jest.fn()
  const disableUserApi = jest.fn()
  const userDetails = userDetailsFactory(
    getUserRolesAndGroupsApi,
    removeRoleApi,
    removeGroupApi,
    enableUserApi,
    disableUserApi,
    defaultSearchUrl,
    '/manage-external-users',
    'Search for an external user',
    true,
  )

  const req = {
    params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
    flash: jest.fn(),
    session: { searchResultsUrl: '/search-external-users/results' },
  }
  const userStub = {
    username: 'BOB',
    firstName: 'Billy',
    lastName: 'Bob',
    email: 'bob@digital.justice.gov.uk',
    enabled: true,
    verified: true,
    lastLoggedIn: '2020-11-23T11:13:08.387065',
  }
  const rolesStub = [{ roleName: 'roleName1', roleCode: 'roleCode1' }]
  const groupsStub = [{ groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true }]
  const expectedUserDetails = {
    searchTitle: 'Search for an external user',
    searchResultsUrl: '/search-external-users/results',
    searchUrl: '/search-external-users',
    staff: {
      firstName: 'Billy',
      lastName: 'Bob',
      name: 'Billy Bob',
      username: 'BOB',
      email: 'bob@digital.justice.gov.uk',
      enabled: true,
      verified: true,
      lastLoggedIn: '2020-11-23T11:13:08.387065',
    },
    staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
    roles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
    groups: [{ groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true }],
    hasMaintainDpsUsersAdmin: false,
    showEnableDisable: true,
    showExtraUserDetails: true,
    displayEmailChangeInProgress: false,
    showGroups: true,
    showUsername: true,
    errors: undefined,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('index', () => {
    it('should call userDetail render', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', expectedUserDetails)
    })

    it('should set showUsername to false if email same as username', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([
        { ...userStub, username: 'BOB@DIGITAL.JUSTICE.GOV.UK', email: 'bob@digital.justice.gov.uk' },
        rolesStub,
        groupsStub,
      ])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        staff: { ...expectedUserDetails.staff, username: 'BOB@DIGITAL.JUSTICE.GOV.UK' },
        showUsername: false,
      })
    })

    it('should set displayEmailChangeInProgress to true if auth email is not verified and different to nomis', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([
        { ...userStub, emailToVerify: 'new.bob@digital.justice.gov.uk', verified: false },
        rolesStub,
        groupsStub,
      ])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        staff: { ...expectedUserDetails.staff, emailToVerify: 'new.bob@digital.justice.gov.uk', verified: false },
        displayEmailChangeInProgress: true,
      })
    })

    it('should only have groups set to showRemove when group manager is member of group', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([
        userStub,
        rolesStub,
        [
          { groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true },
          { groupName: 'groupName3', groupCode: 'groupCode3', showRemove: false },
        ],
      ])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        groups: [
          { groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true },
          { groupName: 'groupName3', groupCode: 'groupCode3', showRemove: false },
        ],
      })
    })

    it('should pass through hasMaintainDpsUsersAdmin to userDetail render', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(req, { render, locals: { user: { maintainAccessAdmin: true } } })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        hasMaintainDpsUsersAdmin: true,
      })
    })

    it('should pass through show fields if not set', async () => {
      const dpsUserDetails = userDetailsFactory(
        getUserRolesAndGroupsApi,
        removeRoleApi,
        undefined,
        undefined,
        undefined,
        '/search-external-users',
        '/manage-external-users',
        'Search for an external user',
        false,
      )
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await dpsUserDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        groups: [{ groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true }],
        showEnableDisable: false,
        showExtraUserDetails: false,
        showGroups: false,
      })
    })

    it('should copy the search results url through from the session', async () => {
      const searchResultsReq = {
        ...req,
        session: { searchResultsUrl: '/some-url' },
      }
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(searchResultsReq, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        searchResultsUrl: '/some-url',
      })
    })

    it('should call getUserRolesAndGroupsApi with maintain admin flag set to false', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      const locals = { user: { maintainAuthUsers: true } }
      await userDetails.index(req, { render: jest.fn(), locals })
      expect(getUserRolesAndGroupsApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', false, true)
    })

    it('should call getUserRolesAndGroupsApi with maintain admin flag set to true', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      const locals = { user: { maintainAccessAdmin: true } }
      await userDetails.index(req, { render: jest.fn(), locals })
      expect(getUserRolesAndGroupsApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', true, false)
    })

    it('uses default search results url when nothing provided through session', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index({ ...req, session: {} }, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        searchResultsUrl: defaultSearchUrl,
      })
    })
  })

  describe('remove role', () => {
    it('should remove role and redirect', async () => {
      const reqWithRoles = { params: { role: 'role1', userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' } }

      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.removeRole(reqWithRoles, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(removeRoleApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'role1')
    })

    it('should ignore if user does not have role', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400 }
      removeRoleApi.mockRejectedValue(error)
      await userDetails.removeRole(
        {
          params: { role: 'role99' },
          originalUrl: '/some-location',
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })
  })

  describe('remove group', () => {
    it('should remove group and redirect', async () => {
      const reqWithGroup = { params: { group: 'group1', userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' } }

      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.removeGroup(reqWithGroup, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(removeGroupApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'group1')
    })

    it('should ignore if user does not have group', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400 }
      removeGroupApi.mockRejectedValue(error)
      await userDetails.removeRole(
        {
          params: { role: 'group99' },
          originalUrl: '/some-location',
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })

    it('should if group Manager tries to delete users last group', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 403 }
      removeGroupApi.mockRejectedValue(error)
      await userDetails.removeRole(
        {
          params: { role: 'group99' },
          originalUrl: '/some-location',
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })

    it('should copy any flash errors over', async () => {
      const reqWithError = {
        ...req,
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(reqWithError, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        errors: { error: 'some error' },
      })
    })
  })

  describe('enable user', () => {
    it('should enable user and redirect', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.enableUser(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(enableUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })

  describe('disable user', () => {
    it('should disable user and redirect', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.disableUser(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(disableUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })
})
