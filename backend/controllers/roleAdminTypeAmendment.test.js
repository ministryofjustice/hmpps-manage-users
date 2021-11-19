const { roleAdminTypeAmendmentFactory } = require('./roleAdminTypeAmendment')

describe('role amendment factory', () => {
  const getRoleDetailsApi = jest.fn()
  const changeRoleAdminTypeApi = jest.fn()
  const changeRoleAdminType = roleAdminTypeAmendmentFactory(getRoleDetailsApi, changeRoleAdminTypeApi, '/manage-roles')

  describe('index', () => {
    it('should call roleAdminType render', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue({
        adminType: [{ adminTypeName: 'LSA role', adminTypeCode: 'DPS_LSA' }],
        roleName: 'Auth Group Manager',
      })

      const render = jest.fn()
      await changeRoleAdminType.index(req, { render })
      expect(render).toBeCalledWith('changeRoleAdminType.njk', {
        adminTypeValues: [
          { text: 'External Administrators', value: 'EXT_ADM', immutable: true },
          { text: 'DPS Local System Administrators (LSA)', value: 'DPS_LSA', immutable: false },
          { text: 'DPS Central Admin', value: 'DPS_ADM', immutable: true },
        ],
        currentFilter: ['DPS_LSA'],
        title: 'Change role admin type for Auth Group Manager',
        roleUrl: '/manage-roles/role1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getRoleDetailsApi.mockResolvedValue({
        adminType: [{ adminTypeName: 'LSA role', adminTypeCode: 'DPS_LSA' }],
        roleName: 'Auth Group Manager',
      })

      const render = jest.fn()
      await changeRoleAdminType.index(req, { render })
      expect(render).toBeCalledWith('changeRoleAdminType.njk', {
        errors: { error: 'some error' },
        title: 'Change role admin type for Auth Group Manager',
        roleUrl: '/manage-roles/role1',
        adminTypeValues: [
          { text: 'External Administrators', value: 'EXT_ADM', immutable: true },
          { text: 'DPS Local System Administrators (LSA)', value: 'DPS_LSA', immutable: false },
          { text: 'DPS Central Admin', value: 'DPS_ADM', immutable: true },
        ],
        currentFilter: ['DPS_LSA'],
      })
    })
  })

  describe('post', () => {
    it('should change the role admin type and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { adminType: ['DPS_ADM'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleAdminType.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleAdminTypeApi).toBeCalledWith(locals, 'role1', ['DPS_ADM'])
    })
    it('should stash the errors and redirect if no role admin type entered', async () => {
      const req = {
        params: { role: 'role1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeRoleAdminType.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeRoleErrors', [{ href: '#adminType', text: 'Select an admin type' }])
    })

    it('should fail gracefully if role name not valid', async () => {
      const redirect = jest.fn()
      const role = {
        roleName: 'role1',
        roleCode: 'code',
        adminType: [{ adminTypeName: 'ADM', adminTypeCode: 'DPS_ADM' }],
      }
      const error = { ...new Error('This failed'), status: 400, response: { body: { error: 'not valid' } } }
      getRoleDetailsApi.mockResolvedValue(role)
      changeRoleAdminTypeApi.mockRejectedValue(error)
      const req = {
        params: { role: 'role1' },
        body: { adminType: ['DPS_ADM', 'DPS_LSA'] },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeRoleAdminType.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeRoleErrors', [{ href: '#adminType', text: 'not valid' }])
    })

    it('should fail gracefully if role name not found', async () => {
      const redirect = jest.fn()
      const role = {
        roleName: 'role1',
        roleCode: 'code',
        adminType: [{ adminTypeName: 'ADM', adminTypeCode: 'DPS_ADM' }],
      }
      const error = {
        ...new Error('This failed'),
        status: 404,
        response: { body: { userMessage: 'Unexpected error: Unable to get role: role1 with reason: notfound' } },
      }
      getRoleDetailsApi.mockResolvedValue(role)
      changeRoleAdminTypeApi.mockRejectedValue(error)
      const req = {
        params: { role: 'role1' },
        body: { adminType: ['DPS_ADM'] },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeRoleAdminType.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeRoleErrors', [
        { href: '#adminType', text: 'Unexpected error: Unable to get role: role1 with reason: notfound' },
      ])
    })
  })
})
