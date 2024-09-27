const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { groupDeleteFactory } = require('./groupDelete')
const { auditAction } = require('../utils/testUtils')
const { ManageUsersEvent } = require('../audit/manageUsersEvent')
const { ManageUsersSubjectType } = require('../audit/manageUsersSubjectType')

describe('group delete factory', () => {
  const getGroupDetailsApi = jest.fn()
  const deleteGroupApi = jest.fn()
  const groupDelete = groupDeleteFactory(getGroupDetailsApi, deleteGroupApi, '/manage-groups')

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call group delete render', async () => {
      const req = { params: { group: 'group1' }, flash: jest.fn() }
      getGroupDetailsApi.mockResolvedValue({
        groupName: 'group name',
      })
      const locals = jest.fn()
      const render = jest.fn()

      await groupDelete.index(req, { render, locals })
      expect(getGroupDetailsApi).toBeCalledWith(locals, 'group1')
      expect(render).toBeCalledWith('groupDelete.njk', {
        group: 'group1',
        groupDetails: {
          groupName: 'group name',
        },
        groupUrl: '/manage-groups/group1',
        maintainUrl: '/manage-groups',
        hasMaintainAuthUsers: false,
        errors: undefined,
      })
    })

    it('should redirect if group does not exist', async () => {
      const error = {
        ...new Error('Does not exist error'),
        status: 404,
        response: { body: { error_description: 'not valid' } },
      }

      const locals = jest.fn()
      const req = { params: { group: 'DOES_NOT_EXIST' }, flash: jest.fn() }
      const redirect = jest.fn()
      getGroupDetailsApi.mockRejectedValue(error)

      await groupDelete.index(req, { redirect, locals })
      expect(getGroupDetailsApi).toBeCalledWith(locals, 'DOES_NOT_EXIST')
      expect(req.flash).toBeCalledWith('groupError', [{ href: '#groupCode', text: 'Group does not exist' }])
      expect(redirect).toBeCalledWith('/manage-groups')
    })
  })

  describe('delete group', () => {
    const username = 'username'
    const userId = 'user id'
    it('it should delete group and redirect', async () => {
      const req = {
        session: { userDetails: { username } },
        params: { group: 'group1', userId },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await groupDelete.deleteGroup(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups')
      expect(deleteGroupApi).toBeCalledWith(locals, 'group1')

      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.DELETE_GROUP_ATTEMPT,
        correlationId: expect.any(String),
        subjectId: 'group1',
        subjectType: ManageUsersSubjectType.GROUP_CODE,
        who: username,
        service: expect.any(String),
        details: null,
      })
    })

    it('should redirect if group to delete does not exist', async () => {
      const error = {
        ...new Error('Does not exist error'),
        status: 404,
        response: { body: { error_description: 'not valid' } },
      }

      const locals = jest.fn()
      const req = {
        params: { group: 'DOES_NOT_EXIST', userId },
        session: { userDetails: { username } },
        flash: jest.fn(),
      }
      const redirect = jest.fn()
      deleteGroupApi.mockRejectedValue(error)

      await groupDelete.deleteGroup(req, { redirect, locals })
      expect(deleteGroupApi).toBeCalledWith(locals, 'DOES_NOT_EXIST')
      expect(req.flash).toBeCalledWith('groupError', [{ href: '#groupCode', text: 'Group does not exist' }])
      expect(redirect).toBeCalledWith('/manage-groups')

      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.DELETE_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.DELETE_GROUP_FAILURE))
    })
  })
})
