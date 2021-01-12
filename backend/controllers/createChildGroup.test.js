const { createChildGroupFactory } = require('./createChildGroup')

describe('create child group factory', () => {
  const createChildGroupApi = jest.fn()
  const createChildGroup = createChildGroupFactory(createChildGroupApi, '/manage-groups')

  describe('index', () => {
    it('should call create child group render', async () => {
      const req = { params: { pgroup: 'P-GROUP' }, flash: jest.fn() }

      const render = jest.fn()
      await createChildGroup.index(req, { render })
      expect(render).toBeCalledWith('createChildGroup.njk', {
        groupUrl: '/manage-groups/P-GROUP',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { pgroup: 'P-GROUP' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }

      const render = jest.fn()
      await createChildGroup.index(req, { render })
      expect(render).toBeCalledWith('createChildGroup.njk', {
        groupUrl: '/manage-groups/P-GROUP',
        errors: { error: 'some error' },
      })
    })
  })

  describe('post', () => {
    it('should create child group and redirect', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
        parentGroupCode: 'P-GROUP',
      })
    })

    it('should trim, group name and redirect', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
        parentGroupCode: 'P-GROUP',
      })
    })

    it('should uppercase group code and redirect', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'bob1', groupName: 'group name ' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
        parentGroupCode: 'P-GROUP',
      })
    })

    it('should stash the errors and redirect if no name and code entered', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: '', groupName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await createChildGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createChildGroupErrors', [
        { href: '#groupCode', text: 'Enter a group code' },
        { href: '#groupName', text: 'Enter a group name' },
      ])
    })

    it('should stash the group and redirect if no code or name entered', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: '', groupName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await createChildGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('group', [{ groupCode: '', groupName: '', parentGroupCode: 'P-GROUP' }])
    })

    it('should fail gracefully if child group already exists', async () => {
      const redirect = jest.fn()
      const error = new Error('This failed')
      // @ts-ignore
      error.status = 409
      // @ts-ignore
      error.response = { body: { error_description: 'Group code already exists' } }

      createChildGroupApi.mockRejectedValue(error)
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await createChildGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createChildGroupErrors', [
        {
          href: '#groupCode',
          text: 'Group code already exists',
        },
      ])
    })
  })
})
