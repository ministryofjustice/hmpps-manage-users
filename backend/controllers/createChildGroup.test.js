const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createChildGroupFactory } = require('./createChildGroup')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { UUID_REGEX } = require('../utils/testConstants')
const { auditAction } = require('../utils/testUtils')

describe('create child group factory', () => {
  const createChildGroupApi = jest.fn()
  const createChildGroup = createChildGroupFactory(createChildGroupApi, '/manage-groups')

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call create child group render', async () => {
      const req = { params: { pgroup: 'P-GROUP' }, flash: jest.fn() }

      const render = jest.fn()
      await createChildGroup.index(req, { render })
      expect(render).toHaveBeenCalledWith('createChildGroup.njk', {
        groupUrl: '/manage-groups/P-GROUP',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { pgroup: 'P-GROUP' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }

      const render = jest.fn()
      await createChildGroup.index(req, { render })
      expect(render).toHaveBeenCalledWith('createChildGroup.njk', {
        groupUrl: '/manage-groups/P-GROUP',
        errors: { error: 'some error' },
      })
    })
  })

  describe('post', () => {
    const session = { userDetails: { username: 'username' } }
    it('should create child group and redirect', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toHaveBeenCalledWith(locals, {
        groupCode: 'BOB1',
        groupName: 'group name',
        parentGroupCode: 'P-GROUP',
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_GROUP_ATTEMPT,
        subjectId: 'BOB1',
        subjectType: ManageUsersSubjectType.GROUP_CODE,
        who: 'username',
        service: 'hmpps-manage-users',
        details: JSON.stringify({ parentGroup: 'P-GROUP' }),
        correlationId: expect.stringMatching(UUID_REGEX),
      })
    })

    it('should trim, group name and redirect', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name ' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toHaveBeenCalledWith(locals, {
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
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await createChildGroup.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/P-GROUP')
      expect(createChildGroupApi).toHaveBeenCalledWith(locals, {
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
        session,
      }

      const redirect = jest.fn()
      await createChildGroup.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('createChildGroupErrors', [
        { href: '#groupCode', text: 'Enter a group code' },
        { href: '#groupName', text: 'Enter a group name' },
      ])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
    })

    it('should stash the group and redirect if no code or name entered', async () => {
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: '', groupName: '' },
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await createChildGroup.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('group', [{ groupCode: '', groupName: '', parentGroupCode: 'P-GROUP' }])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
    })

    it('should fail gracefully if child group already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { error_description: 'Group code already exists' } },
      }

      createChildGroupApi.mockRejectedValue(error)
      const req = {
        params: { pgroup: 'P-GROUP' },
        body: { groupCode: 'BOB1', groupName: 'group name' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createChildGroup.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('createChildGroupErrors', [
        {
          href: '#groupCode',
          text: 'Group code already exists',
        },
      ])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_GROUP_FAILURE))
    })
  })
})
