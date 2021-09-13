const { createRoleFactory } = require('./createRole')

describe('create role factory', () => {
  const createRoleApi = jest.fn()
  const createRole = createRoleFactory(createRoleApi, '/manage-roles')

  describe('index', () => {
    it('should call create role render', async () => {
      const req = { flash: jest.fn() }

      const render = jest.fn()
      await createRole.index(req, { render })
      expect(render).toBeCalledWith('createRole.njk', {
        roleUrl: '/manage-roles',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { flash: jest.fn().mockReturnValue({ error: 'some error' }) }

      const render = jest.fn()
      await createRole.index(req, { render })
      expect(render).toBeCalledWith('createRole.njk', {
        roleUrl: '/manage-roles',
        errors: { error: 'some error' },
      })
    })
  })

  describe('post', () => {
    it('should create role and redirect', async () => {
      const req = {
        body: { roleCode: 'BOB1', roleName: 'role name', adminType: ['EXT_ADM', 'DSP_ADM'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/BOB1')
      expect(createRoleApi).toBeCalledWith(locals, {
        roleCode: 'BOB1',
        roleName: 'role name',
        adminType: ['EXT_ADM', 'DSP_ADM'],
      })
    })

    it('should trim, role name and redirect', async () => {
      const req = {
        body: { roleCode: 'BOB1', roleName: 'role name ', adminType: ['EXT_ADM', 'DSP_ADM'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/BOB1')
      expect(createRoleApi).toBeCalledWith(locals, {
        roleCode: 'BOB1',
        roleName: 'role name',
        adminType: ['EXT_ADM', 'DSP_ADM'],
      })
    })

    it('should put single adminType into an array and redirect', async () => {
      const req = {
        body: { roleCode: 'BOB1', roleName: 'role name ', adminType: 'EXT_ADM' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/BOB1')
      expect(createRoleApi).toBeCalledWith(locals, {
        roleCode: 'BOB1',
        roleName: 'role name',
        adminType: ['EXT_ADM'],
      })
    })

    it('should uppercase role code and redirect', async () => {
      const req = {
        body: { roleCode: 'bob1', roleName: 'role name ', adminType: ['EXT_ADM', 'DSP_ADM'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createRole.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/BOB1')
      expect(createRoleApi).toBeCalledWith(locals, {
        roleCode: 'BOB1',
        roleName: 'role name',
        adminType: ['EXT_ADM', 'DSP_ADM'],
      })
    })

    it('should stash the errors and redirect if no name, code and adminType entered', async () => {
      const req = {
        body: { roleCode: '', roleName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await createRole.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createRoleErrors', [
        { href: '#roleCode', text: 'Enter a role code' },
        { href: '#roleName', text: 'Enter a role name' },
        { href: '#adminType', text: 'Select an admin type' },
      ])
    })

    it('should stash the role and redirect if no code or name entered', async () => {
      const req = {
        body: { roleCode: '', roleName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await createRole.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('role', [{ roleCode: '', roleName: '', adminType: [] }])
    })

    it('should fail gracefully if role already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { error_description: 'Role code already exists' } },
      }

      createRoleApi.mockRejectedValue(error)
      const req = {
        body: { roleCode: 'BOB1', roleName: 'role name', adminType: ['EXT_ADM', 'DSP_ADM'] },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await createRole.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createRoleErrors', [
        {
          href: '#roleCode',
          text: 'Role code already exists',
        },
      ])
    })
  })
})
