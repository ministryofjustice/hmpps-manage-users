const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { childGroupAmendmentFactory } = require('./childGroupNameAmendment')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('child group amendment factory', () => {
  const getGroupDetailsApi = jest.fn()
  const changeGroupNameApi = jest.fn()
  const changeChildGroupName = childGroupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change child group name',
    '/manage-groups',
  )

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call changeGroupName render', async () => {
      const req = { params: { pgroup: 'parent-group', group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeChildGroupName.index(req, { render })
      expect(render).toHaveBeenCalledWith('changeGroupName.njk', {
        currentGroupName: 'group name',
        title: 'Change child group name',
        groupUrl: '/manage-groups/parent-group',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })

      const render = jest.fn()
      await changeChildGroupName.index(req, { render })
      expect(render).toHaveBeenCalledWith('changeGroupName.njk', {
        errors: { error: 'some error' },
        currentGroupName: 'group name',
        title: 'Change child group name',
        groupUrl: '/manage-groups/parent-group',
      })
    })
  })

  describe('post', () => {
    it('should change the child group name and redirect', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        session: { userDetails: { username: 'username' } },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeChildGroupName.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/parent-group')
      expect(changeGroupNameApi).toHaveBeenCalledWith(locals, 'group1', 'GroupA')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.UPDATE_GROUP_ATTEMPT,
        who: 'username',
        subjectId: 'group1',
        subjectType: ManageUsersSubjectType.GROUP_CODE,
        correlationId: expect.any(String),
        service: 'hmpps-manage-users',
        details: JSON.stringify({ parentGroupCode: 'parent-group', newGroupName: 'GroupA' }),
      })
    })

    it('should trim, change the group name and redirect', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: ' GroupA ' },
        flash: jest.fn(),
        session: { userDetails: { username: 'username' } },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeChildGroupName.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-groups/parent-group')
      expect(changeGroupNameApi).toHaveBeenCalledWith(locals, 'group1', 'GroupA')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
    })

    it('should stash the errors and redirect if no group name entered', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session: { userDetails: { username: 'username' } },
      }

      const redirect = jest.fn()
      await changeChildGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('changeGroupErrors', [{ href: '#groupName', text: 'Enter a group name' }])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_FAILURE))
    })

    it('should stash the group name and redirect if no group name entered', async () => {
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session: { userDetails: { username: 'username' } },
      }

      const redirect = jest.fn()
      await changeChildGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('changeGroupName', [undefined])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_FAILURE))
    })

    it('should fail gracefully if group name not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      changeGroupNameApi.mockRejectedValue(error)
      const req = {
        params: { pgroup: 'parent-group', group: 'group1' },
        body: { groupName: 'GroupA' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session: { userDetails: { username: 'username' } },
      }
      await changeChildGroupName.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('changeGroupName', ['GroupA'])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_GROUP_FAILURE))
    })
  })
})
