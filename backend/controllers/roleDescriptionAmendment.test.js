const { roleDescriptionAmendmentFactory } = require('./roleDescriptionAmendment')

describe('role amendment factory', () => {
  const getRoleDetailsApi = jest.fn()
  const changeRoleDescriptionApi = jest.fn()
  const changeRoleDescription = roleDescriptionAmendmentFactory(
    getRoleDetailsApi,
    changeRoleDescriptionApi,
    'Change role description',
    '/manage-roles',
  )

  describe('index', () => {
    it('should call roleDescription render', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue({
        roleDescription: 'role description',
      })

      const render = jest.fn()
      await changeRoleDescription.index(req, { render })
      expect(render).toBeCalledWith('changeRoleDescription.njk', {
        currentRoleDescription: 'role description',
        title: 'Change role description',
        roleUrl: '/manage-roles/role1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getRoleDetailsApi.mockResolvedValue({
        roleDescription: 'role description',
      })

      const render = jest.fn()
      await changeRoleDescription.index(req, { render })
      expect(render).toBeCalledWith('changeRoleDescription.njk', {
        errors: { error: 'some error' },
        currentRoleDescription: 'role description',
        title: 'Change role description',
        roleUrl: '/manage-roles/role1',
      })
    })
  })

  describe('post', () => {
    it('should change the role description and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: 'RoleADesc' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', 'RoleADesc')
    })

    it('should trim, change the role description and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: ' RoleADesc ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', 'RoleADesc')
    })

    it('should stash the role description and redirect if role description is empty', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: '' },
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', '')
    })

    it('should fail gracefully if role description not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      changeRoleDescriptionApi.mockRejectedValue(error)
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: 'RoleADesc' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeRoleDescription.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeRoleDescription', ['RoleADesc'])
    })
  })
})
