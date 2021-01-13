const { groupAmendmentFactory } = require('./groupNameAmendment')

describe('group amendment factory', () => {
  const getGroupDetailsApi = jest.fn()
  const changeGroupNameApi = jest.fn()
  const changeGroupName = groupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change group name',
    '/manage-groups',
  )

  describe('index', () => {
    it('should call groupName render', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeGroupName.index(req, { render })
      expect(render).toBeCalledWith('changeGroupName.njk', {
        currentGroupName: 'group name',
        title: 'Change group name',
        groupUrl: '/manage-groups/group1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeGroupName.index(req, { render })
      expect(render).toBeCalledWith('changeGroupName.njk', {
        errors: { error: 'some error' },
        currentGroupName: 'group name',
        title: 'Change group name',
        groupUrl: '/manage-groups/group1',
      })
    })
  })

  describe('post', () => {
    it('should change the group name and redirect', async () => {
      const req = {
        params: { group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeGroupName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/group1')
      expect(changeGroupNameApi).toBeCalledWith(locals, 'group1', 'GroupA')
    })

    it('should trim, change the group name and redirect', async () => {
      const req = {
        params: { group: 'group1' },
        body: { groupName: ' GroupA ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeGroupName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/group1')
      expect(changeGroupNameApi).toBeCalledWith(locals, 'group1', 'GroupA')
    })

    it('should stash the errors and redirect if no group name entered', async () => {
      const req = {
        params: { group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeGroupName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeGroupErrors', [{ href: '#groupName', text: 'Enter a group name' }])
    })

    it('should stash the group name and redirect if no group name entered', async () => {
      const req = {
        params: { group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeGroupName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeGroupName', [undefined])
    })

    it('should fail gracefully if group name not valid', async () => {
      const redirect = jest.fn()
      const error = new Error('This failed')
      // @ts-ignore
      error.status = 400
      // @ts-ignore
      error.response = { body: { error_description: 'not valid' } }

      changeGroupNameApi.mockRejectedValue(error)
      const req = {
        params: { group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeGroupName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeGroupName', ['GroupA'])
    })
  })
})
