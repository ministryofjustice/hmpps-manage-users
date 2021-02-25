const { selectGroupsFactory } = require('./getGroups')

describe('select groups factory', () => {
  const getGroups = jest.fn()
  const groups = selectGroupsFactory(getGroups, '/manage-groups')

  describe('index', () => {
    it('should call groups render', async () => {
      getGroups.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const req = { flash: jest.fn() }
      const render = jest.fn()
      await groups.index(req, { render })
      expect(render).toBeCalledWith('groups.njk', {
        groupValues: [{ groupName: 'name', groupCode: 'code' }],
        maintainUrl: '/manage-groups',
        errors: undefined,
      })
    })
  })
})
