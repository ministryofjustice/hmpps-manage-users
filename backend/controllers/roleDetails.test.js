const { roleDetailsFactory } = require('./roleDetails')

describe('Role details factory', () => {
  const getRoleDetailsApi = jest.fn()
  const roleDetails = roleDetailsFactory(getRoleDetailsApi, '/manage-roles')

  describe('index', () => {
    it('should call role details render', async () => {
      const req = { params: { role: 'R1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue([
        {
          roleName: 'name',
          roleCode: 'code',
          adminType: [{ adminTypeName: 'LSA', adminTypeId: 'f54f3176-3a12-4785-a7e9-b4b9d8f0ee2e' }],
        },
      ])

      const render = jest.fn()
      await roleDetails.index(req, { render })
      expect(render).toBeCalledWith('roleDetails.njk', {
        roleDetails: [
          {
            roleName: 'name',
            roleCode: 'code',
            adminType: [{ adminTypeName: 'LSA', adminTypeId: 'f54f3176-3a12-4785-a7e9-b4b9d8f0ee2e' }],
          },
        ],
        maintainUrl: '/manage-roles',
      })
    })

    it('should redirect to manage roles if role does not exist', async () => {
      const error = {
        ...new Error('Does not exist error'),
        status: 404,
        response: { body: { error_description: 'not valid' } },
      }

      const req = { params: { role: 'DOES_NOT_EXIST' }, flash: jest.fn() }
      const redirect = jest.fn()
      getRoleDetailsApi.mockRejectedValue(error)

      await roleDetails.index(req, { redirect })
      expect(req.flash).toBeCalledWith('roleError', [{ href: '#roleCode', text: 'Role does not exist' }])
      expect(redirect).toBeCalledWith('/manage-roles')
    })
  })
})
