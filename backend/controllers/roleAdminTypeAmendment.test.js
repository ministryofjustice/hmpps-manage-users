const { roleAdminTypeAmendmentFactory } = require('./roleAdminTypeAmendment')

describe('role amendment factory', () => {
  const getRoleDetailsApi = jest.fn()
  const changeRoleAdminTypeApi = jest.fn()
  const changeRoleAdminType = roleAdminTypeAmendmentFactory(
    getRoleDetailsApi,
    changeRoleAdminTypeApi,
    'Change role admin type',
    '/manage-roles',
  )

  describe('index', () => {
    it('should call roleAdminType render', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue({
        adminType: [{ adminTypeName: 'LSA role', adminTypeCode: 'DPS_LSA' }],
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
        title: 'Change role admin type',
        roleUrl: '/manage-roles/role1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getRoleDetailsApi.mockResolvedValue({
        adminType: [{ adminTypeName: 'LSA role', adminTypeCode: 'DPS_LSA' }],
      })

      const render = jest.fn()
      await changeRoleAdminType.index(req, { render })
      expect(render).toBeCalledWith('changeRoleAdminType.njk', {
        errors: { error: 'some error' },
        title: 'Change role admin type',
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
    it('should stash the role admin types and redirect if no role admin type entered', async () => {
      const req = {
        params: { role: 'role1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeRoleAdminType.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeRoleAdminType', [[]])
    })
  })
})
