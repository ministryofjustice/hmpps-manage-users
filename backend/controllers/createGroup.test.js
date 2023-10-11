const { createGroupFactory } = require('./createGroup')
const { AuditService } = require('../services/auditService')

describe('create group factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const createGroupApi = jest.fn()
  const createGroup = createGroupFactory(createGroupApi, '/manage-groups')
  const mockCreateGroup = jest.fn()
  AuditService.prototype.createGroup = mockCreateGroup

  describe('index', () => {
    it('should call create group render', async () => {
      const req = { flash: jest.fn() }

      const render = jest.fn()
      await createGroup.index(req, { render })
      expect(render).toBeCalledWith('createGroup.njk', {
        groupUrl: '/manage-groups',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { flash: jest.fn().mockReturnValue({ error: 'some error' }) }

      const render = jest.fn()
      await createGroup.index(req, { render })
      expect(render).toBeCalledWith('createGroup.njk', {
        groupUrl: '/manage-groups',
        errors: { error: 'some error' },
      })
    })
  })

  describe('post', () => {
    it('should create group and redirect', async () => {
      const req = {
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/BOB1')
      expect(createGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
      })
      expect(mockCreateGroup).toBeCalledWith({
        adminId: 'username',
        logErrors: true,
        group: {
          groupCode: 'BOB1',
          groupName: 'group name',
        },
        subjectId: 'userId',
      })
    })

    it('should trim, group name and redirect', async () => {
      const req = {
        body: { groupCode: 'BOB1', groupName: 'group name ' },
        flash: jest.fn(),
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/BOB1')
      expect(createGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
      })
      expect(mockCreateGroup).toBeCalledWith({
        adminId: 'username',
        logErrors: true,
        group: {
          groupCode: 'BOB1',
          groupName: 'group name',
        },
        subjectId: 'userId',
      })
    })

    it('should uppercase group code and redirect', async () => {
      const req = {
        body: { groupCode: 'bob1', groupName: 'group name ' },
        flash: jest.fn(),
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createGroup.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/BOB1')
      expect(createGroupApi).toBeCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
      })
      expect(mockCreateGroup).toBeCalledWith({
        adminId: 'username',
        logErrors: true,
        group: {
          groupCode: 'BOB1',
          groupName: 'group name',
        },
        subjectId: 'userId',
      })
    })

    it('should stash the errors and redirect if no name and code entered', async () => {
      const req = {
        body: { groupCode: '', groupName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }

      const redirect = jest.fn()
      await createGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createGroupErrors', [
        { href: '#groupCode', text: 'Enter a group code' },
        { href: '#groupName', text: 'Enter a group name' },
      ])
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })

    it('should stash the group and redirect if no code or name entered', async () => {
      const req = {
        body: { groupCode: '', groupName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }

      const redirect = jest.fn()
      await createGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('group', [{ groupCode: '', groupName: '' }])
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })

    it('should fail gracefully if group already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { error_description: 'Group code already exists' } },
      }

      createGroupApi.mockRejectedValue(error)
      const req = {
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session: { userDetails: { username: 'username' } },
        params: { userId: 'userId' },
      }
      await createGroup.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createGroupErrors', [
        {
          href: '#groupCode',
          text: 'Group code already exists',
        },
      ])
      expect(mockCreateGroup).not.toHaveBeenCalled()
    })
  })
})
