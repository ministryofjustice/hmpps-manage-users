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
      expect(req.flash).toBeCalledWith('groupError')
      expect(render).toBeCalledWith('groups.njk', {
        groupValues: [{ text: 'name', value: 'code' }],
        maintainUrl: '/manage-groups',
        errors: undefined,
      })
    })

    it('should call groups render and show error', async () => {
      getGroups.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const req = { flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      const render = jest.fn()
      await groups.index(req, { render })
      expect(req.flash).toBeCalledWith('groupError')
      expect(render).toBeCalledWith('groups.njk', {
        groupValues: [{ text: 'name', value: 'code' }],
        maintainUrl: '/manage-groups',
        errors: { error: 'some error' },
      })
    })
  })

  describe('search', () => {
    it('should redirect if group code valid', async () => {
      const redirect = jest.fn()
      await groups.search({ body: { groupCode: 'abcde' } }, { redirect })
      expect(redirect).toBeCalledWith('/manage-groups/abcde')
    })
    it('should flash and redirect if group code invalid', async () => {
      const redirect = jest.fn()
      const flash = jest.fn()
      await groups.search({ body: { groupCode: '' }, flash }, { redirect })
      expect(flash).toBeCalledWith('groupError', [{ href: '#groupCode', text: 'Enter a group code' }])
      expect(redirect).toBeCalledWith('/manage-groups/')
    })
  })
})
