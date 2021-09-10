const { roleAmendmentFactory } = require('./roleNameAmendment')

describe('role amendment factory', () => {
  const getRoleDetailsApi = jest.fn()
  const changeRoleNameApi = jest.fn()
  const changeRoleName = roleAmendmentFactory(getRoleDetailsApi, changeRoleNameApi, 'Change role name', '/manage-roles')

  describe('index', () => {
    it('should call roleName render', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue({
        roleName: 'role name',
      })

      const render = jest.fn()
      await changeRoleName.index(req, { render })
      expect(render).toBeCalledWith('changeRoleName.njk', {
        currentRoleName: 'role name',
        title: 'Change role name',
        roleUrl: '/manage-roles/role1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getRoleDetailsApi.mockResolvedValue({
        roleName: 'role name',
      })

      const render = jest.fn()
      await changeRoleName.index(req, { render })
      expect(render).toBeCalledWith('changeRoleName.njk', {
        errors: { error: 'some error' },
        currentRoleName: 'role name',
        title: 'Change role name',
        roleUrl: '/manage-roles/role1',
      })
    })
  })

  describe('post', () => {
    it('should change the role name and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleName: 'RoleA' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleNameApi).toBeCalledWith(locals, 'role1', 'RoleA')
    })

    it('should trim, change the role name and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleName: ' RoleA ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleNameApi).toBeCalledWith(locals, 'role1', 'RoleA')
    })

    it('should stash the errors and redirect if no role name entered', async () => {
      const req = {
        params: { role: 'role1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeRoleName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeRoleErrors', [{ href: '#roleName', text: 'Enter a role name' }])
    })

    it('should stash the role name and redirect if no role name entered', async () => {
      const req = {
        params: { role: 'role1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeRoleName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeRoleName', [undefined])
    })

    it('should fail gracefully if role name not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      changeRoleNameApi.mockRejectedValue(error)
      const req = {
        params: { role: 'role1' },
        body: { roleName: 'RoleA' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeRoleName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeRoleName', ['RoleA'])
    })
  })
})
