const { groupDetailsFactory } = require('./groupDetails')

describe('Group details factory', () => {
  const getGroupDetailsApi = jest.fn()
  const deleteChildGroupApi = jest.fn()
  const logError = jest.fn()
  const groupDetails = groupDetailsFactory(getGroupDetailsApi, deleteChildGroupApi, '/manage-groups', logError)

  describe('index', () => {
    it('should call group detials render', async () => {
      const req = { params: { group: 'G1' } }
      getGroupDetailsApi.mockResolvedValue([
        {
          groupName: 'name',
          groupCode: 'code',
          assignableRolls: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
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
            assignableRolls: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
            children: [{ groupName: 'groupName4', groupCode: 'groupCode4' }],
          },
        ],
        maintainUrl: '/manage-groups',
        hasMaintainAuthUsers: false,
      })
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

    it('should call error on failure', async () => {
      const render = jest.fn()
      deleteChildGroupApi.mockRejectedValue(new Error('This failed'))
      await groupDetails.deleteChildGroup({ params: { pgroup: 'JOE', group: 'group19' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-groups/JOE' })
    })
  })
})
