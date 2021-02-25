const { groupDetailsFactory } = require('./groupDetails')

describe('Group details factory', () => {
  const getGroupDetailsApi = jest.fn()
  const deleteChildGroupApi = jest.fn()
  const groupDetails = groupDetailsFactory(getGroupDetailsApi, deleteChildGroupApi, '/manage-groups')

  describe('index', () => {
    it('should call group details render', async () => {
      const req = { params: { group: 'G1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue([
        {
          groupName: 'name',
          groupCode: 'code',
          assignableRoles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
          children: [{ groupName: 'groupName4', groupCode: 'groupCode4' }],
        },
      ])

      const render = jest.fn()
      await groupDetails.index(req, { render })
      expect(render).toBeCalledWith('groupDetails.njk', {
        groupDetails: [
          {
            groupName: 'name',
            groupCode: 'code',
            assignableRoles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
            children: [{ groupName: 'groupName4', groupCode: 'groupCode4' }],
          },
        ],
        maintainUrl: '/manage-groups',
        hasMaintainAuthUsers: false,
      })
    })

    it('should redirect to manage groups if group does not exist', async () => {
      const error = new Error('Does not exist error')
      // @ts-ignore
      error.status = 404
      // @ts-ignore
      error.response = { body: { error_description: 'not valid' } }

      const req = { params: { group: 'DOES_NOT_EXIST' }, flash: jest.fn() }
      const redirect = jest.fn()
      getGroupDetailsApi.mockRejectedValue(error)

      await groupDetails.index(req, { redirect })
      expect(req.flash).toBeCalledWith('groupError', [{ href: '#groupCode', text: 'Group does not exist' }])
      expect(redirect).toBeCalledWith('/manage-groups')
    })
  })

  describe('delete child group', () => {
    it('should remove group and redirect', async () => {
      const req = { params: { pgroup: 'JOE', group: 'GROUP1' } }

      const redirect = jest.fn()
      const locals = jest.fn()
      await groupDetails.deleteChildGroup(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/JOE')
      expect(deleteChildGroupApi).toBeCalledWith(locals, 'GROUP1')
    })
  })
})
