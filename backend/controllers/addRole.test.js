const { addRoleFactory } = require('./addRole')

describe('addRole factory', () => {
  const oauthApi = {}
  const prisonApi = {}
  const logError = jest.fn()
  const addRole = addRoleFactory(oauthApi, prisonApi, logError)

  describe('index', () => {
    it('should call addRole render', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn() }
      oauthApi.assignableRoles = jest.fn().mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])
      oauthApi.getUser = jest.fn().mockResolvedValue({ username: 'BOB', firstName: 'Billy', lastName: 'Bob' })

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        maintainTitle: 'Maintain auth users',
        maintainUrl: '/maintain-auth-users',
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/maintain-auth-users/joe',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      oauthApi.assignableRoles = jest.fn().mockResolvedValue([])
      oauthApi.getUser = jest.fn().mockResolvedValue({ username: 'BOB', firstName: 'Billy', lastName: 'Bob' })

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Maintain auth users',
        maintainUrl: '/maintain-auth-users',
        roleDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/maintain-auth-users/joe',
      })
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      oauthApi.assignableRoles = jest.fn().mockRejectedValue(new Error('This failed'))
      await addRole.index({ params: { username: 'joe' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/maintain-auth-users/joe' })
    })
  })

  describe('post', () => {
    it('should add the role and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { roles: ['GLOBAL_SEARCH', 'BOB'] }, flash: jest.fn() }
      oauthApi.addUserRoles = jest.fn()

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/maintain-auth-users/joe')
      expect(oauthApi.addUserRoles).toBeCalledWith(locals, { username: 'joe', roles: ['GLOBAL_SEARCH', 'BOB'] })
    })

    it('should cope with single role being added', async () => {
      const req = { params: { username: 'joe' }, body: { roles: 'GLOBAL_SEARCH' }, flash: jest.fn() }
      oauthApi.addUserRoles = jest.fn()

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/maintain-auth-users/joe')
      expect(oauthApi.addUserRoles).toBeCalledWith(locals, { username: 'joe', roles: ['GLOBAL_SEARCH'] })
    })

    it('should stash the errors and redirect if no roles selected', async () => {
      const req = { params: { username: 'joe' }, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await addRole.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addRoleErrors', [{ href: '#roles', text: 'Select at least one role' }])
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      oauthApi.addUserRoles = jest.fn().mockRejectedValue(new Error('This failed'))
      await addRole.index({ params: { username: 'joe' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/maintain-auth-users/joe' })
    })
  })
})
