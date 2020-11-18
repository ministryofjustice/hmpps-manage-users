const { selectGroupFactory } = require('./addGroup')

describe('select groups factory', () => {
  const getUserAndGroups = jest.fn()
  const saveGroup = jest.fn()
  const logError = jest.fn()
  const addGroup = selectGroupFactory(
    getUserAndGroups,
    saveGroup,
    '/maintain-auth-users',
    'Maintain auth users',
    logError
  )

  describe('index', () => {
    it('should call addGroup render', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        [{ groupName: 'name', groupCode: 'code' }],
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ groupName: 'name2', groupCode: 'code2' }],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: undefined,
        maintainTitle: 'Maintain auth users',
        maintainUrl: '/maintain-auth-users',
        groupDropdownValues: [
          { text: '', value: '' },
          { text: 'name', value: 'code' },
        ],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/maintain-auth-users/joe',
      })
    })

    it('should filter out existing groups', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        [{ groupName: 'name', groupCode: 'code' }],
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { groupName: 'name', groupCode: 'code' },
          { groupName: 'name2', groupCode: 'code2' },
        ],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: undefined,
        maintainTitle: 'Maintain auth users',
        maintainUrl: '/maintain-auth-users',
        groupDropdownValues: [{ text: '', value: '' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/maintain-auth-users/joe',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getUserAndGroups.mockResolvedValue([[], { username: 'BOB', firstName: 'Billy', lastName: 'Bob' }, []])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Maintain auth users',
        maintainUrl: '/maintain-auth-users',
        groupDropdownValues: [{ text: '', value: '' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/maintain-auth-users/joe',
      })
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      getUserAndGroups.mockRejectedValue(new Error('This failed'))
      await addGroup.index({ params: { username: 'joe' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/maintain-auth-users/joe' })
    })
  })

  describe('post', () => {
    it('should add the group and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { group: 'GLOBAL_SEARCH' }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/maintain-auth-users/joe')
      expect(saveGroup).toBeCalledWith(locals, 'joe', 'GLOBAL_SEARCH')
    })

    it('should stash the errors and redirect if no group selected', async () => {
      const req = { params: { username: 'joe' }, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await addGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addGroupErrors', [{ href: '#group', text: 'Select a group' }])
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      saveGroup.mockRejectedValue(new Error('This failed'))
      await addGroup.post(
        { params: { username: 'joe' }, body: { group: 'GLOBAL_SEARCH' }, flash: jest.fn() },
        { render }
      )
      expect(render).toBeCalledWith('error.njk', { url: '/maintain-auth-users/joe/select-group' })
    })

    it('should fail gracefully if group already on user', async () => {
      const redirect = jest.fn()
      const error = new Error('This failed')
      // @ts-ignore
      error.status = 409
      saveGroup.mockRejectedValue(error)
      await addGroup.post(
        {
          params: { username: 'joe' },
          body: { group: 'GLOBAL_SEARCH' },
          flash: jest.fn(),
          originalUrl: '/some-location',
        },
        { redirect }
      )
      expect(redirect).toBeCalledWith('/some-location')
    })
  })
})
