const { selectRolesFactory } = require('./addRole')

describe('select roles factory', () => {
  const getUserAndRoles = jest.fn()
  const saveRoles = jest.fn()
  const logError = jest.fn()
  const addRole = selectRolesFactory(
    getUserAndRoles,
    saveRoles,
    '/maintain-external-users',
    '/manage-external-users',
    'Maintain external users',
    logError
  )

  describe('index', () => {
    it('should call addRole render', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn() }
      getUserAndRoles.mockResolvedValue([
        [{ roleName: 'name', roleCode: 'code' }],
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        maintainTitle: 'Maintain external users',
        maintainUrl: '/maintain-external-users',
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/joe',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getUserAndRoles.mockResolvedValue([[], { username: 'BOB', firstName: 'Billy', lastName: 'Bob' }])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Maintain external users',
        maintainUrl: '/maintain-external-users',
        roleDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/joe',
      })
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      getUserAndRoles.mockRejectedValue(new Error('This failed'))
      await addRole.index({ params: { username: 'joe' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-external-users/joe' })
    })
  })

  describe('post', () => {
    it('should add the role and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { roles: ['GLOBAL_SEARCH', 'BOB'] }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/joe')
      expect(saveRoles).toBeCalledWith(locals, 'joe', ['GLOBAL_SEARCH', 'BOB'])
    })

    it('should cope with single role being added', async () => {
      const req = { params: { username: 'joe' }, body: { roles: 'GLOBAL_SEARCH' }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/joe')
      expect(saveRoles).toBeCalledWith(locals, 'joe', ['GLOBAL_SEARCH'])
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
      saveRoles.mockRejectedValue(new Error('This failed'))
      await addRole.post({ params: { username: 'joe' }, body: { roles: 'GLOBAL_SEARCH' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-external-users/joe/select-roles' })
    })
  })
})
