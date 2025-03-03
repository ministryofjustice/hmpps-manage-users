const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { selectRolesFactory } = require('./addRole')
const { auditAction } = require('../utils/testUtils')
const { ManageUsersEvent } = require('../audit/manageUsersEvent')
const { ManageUsersSubjectType } = require('../audit/manageUsersSubjectType')

describe('select roles factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const getUserRolesAndMessage = jest.fn()
  const saveRoles = jest.fn()

  const addRole = selectRolesFactory(getUserRolesAndMessage, saveRoles, '/manage-external-users')
  const session = { userDetails: { username: 'JoeAdmin' } }

  describe('index', () => {
    it('should call addRole render', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ roleName: 'name', roleCode: 'code' }],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })

      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.VIEW_USER_ROLES_ATTEMPT))
    })

    it('should call addRole render excluding oauth admin', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { roleName: 'name', roleCode: 'code' },
          { roleName: 'Oauth admin', roleCode: 'OAUTH_ADMIN' },
        ],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })

    it('should call addRole render including oauth admin', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { roleName: 'name', roleCode: 'code' },
          { roleName: 'Oauth admin', roleCode: 'OAUTH_ADMIN' },
        ],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render, locals: { user: { maintainOAuthAdmin: true } } })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [
          { text: 'name', value: 'code' },
          { text: 'Oauth admin', value: 'OAUTH_ADMIN' },
        ],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })

    it('should call addRole render excluding manage user allow list', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { roleName: 'name', roleCode: 'code' },
          { roleName: 'Manage user allow list', roleCode: 'MANAGE_USER_ALLOW_LIST' },
        ],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })

    it('should call addRole render including manage user allow list', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { roleName: 'name', roleCode: 'code' },
          { roleName: 'Manage user allow list', roleCode: 'MANAGE_USER_ALLOW_LIST' },
        ],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render, locals: { user: { manageUserAllowList: true } } })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [
          { text: 'name', value: 'code' },
          { text: 'Manage user allow list', value: 'MANAGE_USER_ALLOW_LIST' },
        ],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })

    it('should call addRole render including oauth admin and manage user allow list', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { roleName: 'name', roleCode: 'code' },
          { roleName: 'Oauth admin', roleCode: 'OAUTH_ADMIN' },
          { roleName: 'Manage user allow list', roleCode: 'MANAGE_USER_ALLOW_LIST' },
        ],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render, locals: { user: { maintainOAuthAdmin: true, manageUserAllowList: true } } })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [
          { text: 'name', value: 'code' },
          { text: 'Oauth admin', value: 'OAUTH_ADMIN' },
          { text: 'Manage user allow list', value: 'MANAGE_USER_ALLOW_LIST' },
        ],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
        get: jest.fn().mockReturnValue('localhost'),
        session,
      }
      getUserRolesAndMessage.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [],
        { message: 'roles message' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: { error: 'some error' },
        roleDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        message: 'roles message',
      })
    })
  })

  describe('post', () => {
    it('should add the role and redirect', async () => {
      const req = {
        session: { userDetails: { username: 'JoeAdmin' } },
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { roles: ['GLOBAL_SEARCH', 'BOB'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.ADD_USER_ROLES_ATTEMPT,
        details: '{"roles":["GLOBAL_SEARCH","BOB"]}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'JoeAdmin',
        service: expect.any(String),
        correlationId: expect.any(String),
      })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveRoles).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', ['GLOBAL_SEARCH', 'BOB'])
    })

    it('should cope with single role being added', async () => {
      const req = {
        session: { userDetails: { username: 'JoeAdmin' } },
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { roles: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.ADD_USER_ROLES_ATTEMPT,
        details: '{"roles":["GLOBAL_SEARCH"]}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'JoeAdmin',
        service: expect.any(String),
        correlationId: expect.any(String),
      })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveRoles).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', ['GLOBAL_SEARCH'])
    })

    it('should stash the errors and redirect if no roles selected', async () => {
      const req = {
        session: { userDetails: { username: 'JoeAdmin' } },
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await addRole.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addRoleErrors', [{ href: '#roles', text: 'Select at least one role' }])

      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })
  })
})
