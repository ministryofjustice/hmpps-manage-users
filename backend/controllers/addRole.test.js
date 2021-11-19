const { selectRolesFactory } = require('./addRole')

describe('select roles factory', () => {
  const getUserAndRoles = jest.fn()
  const saveRoles = jest.fn()
  const addRole = selectRolesFactory(getUserAndRoles, saveRoles, '/maintain-external-users', '/manage-external-users')

  describe('index', () => {
    it('should call addRole render', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
      }
      getUserAndRoles.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ roleName: 'name', roleCode: 'code' }],
      ])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: undefined,
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        feedbackUrl: 'https://eu.surveymonkey.com/r/66HQSVJ?source=localhost/select-roles',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
        get: jest.fn().mockReturnValue('localhost'),
      }
      getUserAndRoles.mockResolvedValue([{ username: 'BOB', firstName: 'Billy', lastName: 'Bob' }, []])

      const render = jest.fn()
      await addRole.index(req, { render })
      expect(render).toBeCalledWith('addRole.njk', {
        errors: { error: 'some error' },
        roleDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        feedbackUrl: 'https://eu.surveymonkey.com/r/66HQSVJ?source=localhost/select-roles',
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
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
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
      const locals = jest.fn()
      await addRole.post(req, { redirect, locals })
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
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addRoleErrors', [{ href: '#roles', text: 'Select at least one role' }])
    })
  })
})
