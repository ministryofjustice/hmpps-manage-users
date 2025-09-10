const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { groupAmendmentFactory } = require('./groupNameAmendment')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('group amendment factory', () => {
  const getGroupDetailsApi = jest.fn()
  const changeGroupNameApi = jest.fn()
  const changeGroupName = groupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change group name',
    '/manage-groups',
  )

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call groupName render', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeGroupName.index(req, { render })
      expect(render).toHaveBeenCalledWith('changeGroupName.njk', {
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
      expect(render).toHaveBeenCalledWith('changeGroupName.njk', {
        errors: { error: 'some error' },
        currentGroupName: 'group name',
        title: 'Change group name',
        groupUrl: '/manage-groups/group1',
      })
    })
  })

  describe('post', () => {
    const session = { userDetails: { username: 'username' } }
    it('should change the group name and redirect', async () => {
      const req = {
        params: { group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeGroupName.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/group1')
      expect(changeGroupNameApi).toHaveBeenCalledWith(locals, 'group1', 'GroupA')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.UPDATE_GROUP_ATTEMPT,
        details: '{"newGroupName":"GroupA"}',
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
        subjectId: 'group1',
        subjectType: ManageUsersSubjectType.GROUP_CODE,
      })
    })

    it('should trim, change the group name and redirect', async () => {
      const req = {
        params: { group: 'group1' },
        body: { groupName: ' GroupA ' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeGroupName.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/group1')
      expect(changeGroupNameApi).toHaveBeenCalledWith(locals, 'group1', 'GroupA')
    })

    it('should stash the errors and redirect if no group name entered', async () => {
      const req = {
        params: { group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await changeGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('changeGroupErrors', [{ href: '#groupName', text: 'Enter a group name' }])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
    })

    it('should stash the group name and redirect if no group name entered', async () => {
      const req = {
        params: { group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await changeGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('changeGroupName', [undefined])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
    })

    it('should fail gracefully if group name not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      changeGroupNameApi.mockRejectedValue(error)
      const req = {
        params: { group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('changeGroupName', ['GroupA'])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
    })
  })
})
