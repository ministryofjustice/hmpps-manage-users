const { childGroupAmendmentFactory } = require('./childGroupNameAmendment')

describe('child group amendment factory', () => {
  const getGroupDetailsApi = jest.fn()
  const changeGroupNameApi = jest.fn()
  const logError = jest.fn()
  const changeChildGroupName = childGroupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change child group name',
    '/manage-groups',
    logError
  )

  describe('index', () => {
    it('should call changeGroupName render', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeChildGroupName.index(req, { render })
      expect(render).toBeCalledWith('changeGroupName.njk', {
        currentGroupName: 'group name',
        title: 'Change child group name',
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
      await changeChildGroupName.index(req, { render })
      expect(render).toBeCalledWith('changeGroupName.njk', {
        errors: { error: 'some error' },
        currentGroupName: 'group name',
        title: 'Change child group name',
        groupUrl: '/manage-groups/group1',
      })
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      getGroupDetailsApi.mockRejectedValue(new Error('This failed'))
      await changeChildGroupName.index({ params: { group: 'group1' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-groups/group1' })
    })
  })

  describe('post', () => {
    it('should change the child group name and redirect', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeChildGroupName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/parent-group')
      expect(changeGroupNameApi).toBeCalledWith(locals, 'group1', 'GroupA')
    })

    it('should trim, change the group name and redirect', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: ' GroupA ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeChildGroupName.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/parent-group')
      expect(changeGroupNameApi).toBeCalledWith(locals, 'group1', 'GroupA')
    })

    it('should stash the errors and redirect if no group name entered', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeChildGroupName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeGroupErrors', [{ href: '#groupName', text: 'Enter a group name' }])
    })

    it('should stash the group name and redirect if no group name entered', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await changeChildGroupName.post(req, { redirect })
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
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeChildGroupName.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeGroupName', ['GroupA'])
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      changeGroupNameApi.mockRejectedValue(new Error('This failed'))
      await changeChildGroupName.post(
        { params: { pgroup: 'parent-group', group: 'group1' }, body: { groupName: 'GroupA' } },
        { render }
      )
      expect(render).toBeCalledWith('error.njk', { url: '/manage-groups/parent-group/change-group-name' })
    })
  })
})
