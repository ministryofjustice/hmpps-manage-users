const { selectGroupsFactory } = require('./getGroups')

describe('select groups factory', () => {
  const getGroups = jest.fn()
  const logError = jest.fn()
  const groups = selectGroupsFactory(getGroups, logError)

  describe('index', () => {
    it('should call groups render', async () => {
      getGroups.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const render = jest.fn()
      await groups.index(jest.fn(), { render })
      expect(render).toBeCalledWith('groups.njk', {
        groupValues: [{ groupName: 'name', groupCode: 'code' }],
      })
    })
  })
})
