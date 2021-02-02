const { groupDeleteFactory } = require('./groupDelete')

describe('group delete factory', () => {
  const getGroupDetailsApi = jest.fn()
  const deleteGroupApi = jest.fn()
  const groupDelete = groupDeleteFactory(getGroupDetailsApi, deleteGroupApi, '/manage-groups')

  describe('index', () => {
    it('should call group delete render', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await groupDelete.index(req, { render })
      expect(render).toBeCalledWith('groupDelete.njk', {
        group: 'group1',
        groupDetails: {
          groupName: 'group name',
        },
        groupUrl: '/manage-groups/group1',
        maintainUrl: '/manage-groups',
        hasMaintainAuthUsers: false,
        errors: undefined,
      })
    })
  })

  describe('delete group', () => {
    it('it should delete group and redirect', async () => {
      const req = { params: { group: 'group1' } }

      const redirect = jest.fn()
      const locals = jest.fn()
      await groupDelete.deleteGroup(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups')
      expect(deleteGroupApi).toBeCalledWith(locals, 'group1')
    })
  })
})
