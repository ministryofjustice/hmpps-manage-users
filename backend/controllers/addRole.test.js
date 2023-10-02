const { selectRolesFactory } = require('./addRole')
const { AuditService } = require('../services/auditService')

describe('select roles factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const getUserRolesAndMessage = jest.fn()
  const saveRoles = jest.fn()
  jest.mock('../services/auditService')
  const mockAddRoleToUser = jest.fn()
  AuditService.prototype.addRoleToUser = mockAddRoleToUser

  const addRole = selectRolesFactory(getUserRolesAndMessage, saveRoles, '/manage-external-users')

  describe('index', () => {
    it('should call addRole render', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
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
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
        get: jest.fn().mockReturnValue('localhost'),
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
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { roles: ['GLOBAL_SEARCH', 'BOB'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = { user: 'admin' }
      await addRole.post(req, { redirect, locals })
      expect(mockAddRoleToUser).toBeCalledWith({
        admin: 'admin',
        logErrors: true,
        roles: ['GLOBAL_SEARCH', 'BOB'],
        user: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveRoles).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', ['GLOBAL_SEARCH', 'BOB'])
    })

    it('should cope with single role being added', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { roles: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = { user: 'admin' }
      await addRole.post(req, { redirect, locals })
      expect(mockAddRoleToUser).toBeCalledWith({
        admin: 'admin',
        logErrors: true,
        roles: ['GLOBAL_SEARCH'],
        user: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveRoles).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', ['GLOBAL_SEARCH'])
    })

    it('should stash the errors and redirect if no roles selected', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await addRole.post(req, { redirect })
      expect(mockAddRoleToUser).not.toHaveBeenCalled()
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addRoleErrors', [{ href: '#roles', text: 'Select at least one role' }])
    })
  })
})
