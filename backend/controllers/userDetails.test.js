const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { userDetailsFactory } = require('./userDetails')
const { UUID_REGEX } = require('../utils/testConstants')

describe('user detail factory', () => {
  const defaultSearchUrl = '/search-external-users'
  const render = jest.fn()
  const getUserRolesAndGroupsApi = jest.fn()
  const removeUserRoleApi = jest.fn()
  const removeGroupApi = jest.fn()
  const removeUserCaseloadApi = jest.fn()
  const enableUserApi = jest.fn()
  const disableUserApi = jest.fn()

  const dpsUserDetails = userDetailsFactory(
    getUserRolesAndGroupsApi,
    removeUserRoleApi,
    undefined,
    removeUserCaseloadApi,
    enableUserApi,
    disableUserApi,
    '/search-with-filter-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    false,
    false,
  )
  const userDetails = userDetailsFactory(
    getUserRolesAndGroupsApi,
    removeUserRoleApi,
    removeGroupApi,
    removeUserCaseloadApi,
    enableUserApi,
    disableUserApi,
    defaultSearchUrl,
    '/manage-external-users',
    'Search for an external user',
    true,
    true,
  )

  const req = {
    params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
    flash: jest.fn(),
    session: { searchResultsUrl: '/search-external-users/results', userDetails: { username: 'username' } },
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
  const caseloadsStub = [
    { id: 'PVI', name: 'Pentonville (HMP)' },
    { id: 'MDI', name: 'Moorland (HMP)' },
  ]
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
    canAutoEnableDisableUser: true,
    roles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
    groups: [{ groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true }],
    caseloads: undefined,
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
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    const expectedViewUserAttemptAuditMessage = expect.objectContaining({
      action: 'VIEW_USER_ATTEMPT',
      correlationId: expect.stringMatching(UUID_REGEX),
      subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      subjectType: 'USER_ID',
      who: 'username',
    })

    it('should call userDetail render', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', expectedUserDetails)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
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
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should order and set caseloads, if returned', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub, caseloadsStub])
      await userDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        caseloads: [
          {
            id: 'MDI',
            name: 'Moorland (HMP)',
          },
          {
            id: 'PVI',
            name: 'Pentonville (HMP)',
          },
        ],
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
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
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
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
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should pass through hasMaintainDpsUsersAdmin to userDetail render', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(req, { render, locals: { user: { maintainAccessAdmin: true } } })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        hasMaintainDpsUsersAdmin: true,
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should pass through show fields if not set', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await dpsUserDetails.index(req, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-with-filter-dps-users',
        staffUrl: '/manage-dps-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        groups: [{ groupName: 'groupName2', groupCode: 'groupCode2', showRemove: true }],
        canAutoEnableDisableUser: false,
        showEnableDisable: false,
        showExtraUserDetails: false,
        showGroups: false,
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should copy the search results url through from the session', async () => {
      const searchResultsReq = {
        ...req,
        session: { searchResultsUrl: '/some-url', userDetails: { username: 'username' } },
      }
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index(searchResultsReq, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        searchResultsUrl: '/some-url',
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should call getUserRolesAndGroupsApi with maintain admin flag set to false', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      const locals = { user: { maintainAuthUsers: true } }
      await userDetails.index(req, { render: jest.fn(), locals })
      expect(getUserRolesAndGroupsApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', false, true)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should call getUserRolesAndGroupsApi with maintain admin flag set to true', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      const locals = { user: { maintainAccessAdmin: true } }
      await userDetails.index(req, { render: jest.fn(), locals })
      expect(getUserRolesAndGroupsApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', true, false)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('uses default search results url when nothing provided through session', async () => {
      getUserRolesAndGroupsApi.mockResolvedValue([userStub, rolesStub, groupsStub])
      await userDetails.index({ ...req, session: { userDetails: { username: 'username' } } }, { render })
      expect(render).toBeCalledWith('userDetails.njk', {
        ...expectedUserDetails,
        searchResultsUrl: defaultSearchUrl,
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
    })

    it('should publish attempt and failure audit messages when userDetail render fails', async () => {
      getUserRolesAndGroupsApi.mockRejectedValue(new Error('Error for test'))

      try {
        await userDetails.index(req, { render })
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe('Error for test')
      }

      expect(render).not.toHaveBeenCalled()
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewUserAttemptAuditMessage)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'VIEW_USER_FAILURE',
          correlationId: expect.stringMatching(UUID_REGEX),
          subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
          subjectType: 'USER_ID',
          who: 'username',
        }),
      )
    })
  })

  describe('remove role', () => {
    it('should remove role and redirect', async () => {
      const reqWithRoles = {
        session: { userDetails: { username: 'username' } },
        params: { role: 'role1', userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.removeRole(reqWithRoles, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(removeUserRoleApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'role1')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: 'REMOVE_USER_ROLE',
        details: '{"role":"role1"}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
      })
    })

    it('should ignore if user does not have role', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400 }
      removeUserRoleApi.mockRejectedValue(error)
      await userDetails.removeRole(
        {
          params: { role: 'role99' },
          originalUrl: '/some-location',
          session: { userDetails: { username: 'username' } },
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
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
          session: { userDetails: { username: 'username' } },
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })

    it('should fail gracefully if group Manager tries to delete users last group', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 403 }
      removeGroupApi.mockRejectedValue(error)
      await userDetails.removeRole(
        {
          params: { role: 'group99' },
          originalUrl: '/some-location',
          session: { userDetails: { username: 'username' } },
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

  describe('remove caseload', () => {
    it('should remove caseload and redirect', async () => {
      const reqWithCaseload = {
        session: { userDetails: { username: 'username' } },
        params: { caseload: 'TEST_CASELOAD', userId: 'TEST_USER' },
      }
      const redirect = jest.fn()
      const locals = jest.fn()
      await dpsUserDetails.removeUserCaseload(reqWithCaseload, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-dps-users/TEST_USER/details')
      expect(removeUserCaseloadApi).toBeCalledWith(locals, 'TEST_USER', 'TEST_CASELOAD')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'REMOVE_USER_CASELOAD',
        details: '{"caseload":"TEST_CASELOAD"}',
        subjectId: 'TEST_USER',
        subjectType: 'USER_ID',
        who: 'username',
      })
    })

    it('should ignore if error', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400 }
      removeUserCaseloadApi.mockRejectedValue(error)
      await userDetails.removeUserCaseload(
        {
          params: { caseload: 'TEST_CASELOAD' },
          originalUrl: '/some-location',
          session: { userDetails: { username: 'username' } },
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should refresh user details if user does not have caseload', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('Does not exist error'), status: 404 }
      removeUserCaseloadApi.mockRejectedValue(error)
      await userDetails.removeUserCaseload(
        {
          params: { caseload: 'TEST_CASELOAD', userId: 'TEST_USER' },
          session: { userDetails: { username: 'username' } },
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/manage-external-users/TEST_USER/details')
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })
  })

  describe('enable user', () => {
    it('should enable user and redirect', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.enableUser(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: 'ENABLE_USER',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
      })
      expect(enableUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })

  describe('disable user', () => {
    it('should disable user and redirect', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      await userDetails.disableUser(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'DISABLE_USER',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
      })
      expect(disableUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })
})
