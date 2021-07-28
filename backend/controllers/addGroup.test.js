const { selectGroupFactory } = require('./addGroup')

describe('select groups factory', () => {
  const getUserAndGroups = jest.fn()
  const saveGroup = jest.fn()
  const addGroup = selectGroupFactory(getUserAndGroups, saveGroup, '/maintain-external-users', '/manage-external-users')

  describe('index', () => {
    it('should call addGroup render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ groupName: 'name', groupCode: 'code' }],
        [{ groupName: 'name2', groupCode: 'code2' }],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: undefined,
        groupDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })

    it('should filter out existing groups', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ groupName: 'name', groupCode: 'code' }],
        [
          { groupName: 'name', groupCode: 'code' },
          { groupName: 'name2', groupCode: 'code2' },
        ],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: undefined,
        groupDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      getUserAndGroups.mockResolvedValue([{ username: 'BOB', firstName: 'Billy', lastName: 'Bob' }, [], []])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toBeCalledWith('addGroup.njk', {
        errors: { error: 'some error' },
        groupDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })
  })

  describe('post', () => {
    it('should add the group and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { group: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveGroup).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'GLOBAL_SEARCH')
    })

    it('should stash the errors and redirect if no group selected', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await addGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addGroupErrors', [{ href: '#group', text: 'Select a group' }])
    })

    it('should fail gracefully if group already on user', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 409 }
      saveGroup.mockRejectedValue(error)
      await addGroup.post(
        {
          params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
          body: { group: 'GLOBAL_SEARCH' },
          flash: jest.fn(),
          originalUrl: '/some-location',
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })

    it('should fail gracefully if group manager not allowed to maintain user', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 403 }
      saveGroup.mockRejectedValue(error)
      await addGroup.post(
        {
          params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
          body: { group: 'GLOBAL_SEARCH' },
          flash: jest.fn(),
          originalUrl: '/some-location',
        },
        { redirect },
      )
      expect(redirect).toBeCalledWith('/some-location')
    })
  })
})
