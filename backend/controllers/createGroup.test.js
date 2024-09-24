const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createGroupFactory } = require('./createGroup')
const { ManageUsersEvent } = require('../audit')
const config = require('../config')
const { auditAction } = require('../utils/testUtils')

describe('create group factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const createGroupApi = jest.fn()
  const createGroup = createGroupFactory(createGroupApi, '/manage-groups')

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
        body: { groupCode: 'BOB1', groupName: 'group name', _csrf: 'csrf' },
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
        _csrf: 'csrf',
      })
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.CREATE_GROUP_ATTEMPT,
        details: '{"group":{"groupCode":"BOB1","groupName":"group name"}}',
        subjectId: null,
        subjectType: null,
        who: 'username',
        service: config.default.productId,
        correlationId: expect.any(String),
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
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
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
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
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
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
    })
  })
})
