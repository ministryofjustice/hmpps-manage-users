const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { groupDetailsFactory } = require('./groupDetails')
const { UUID_REGEX } = require('../utils/testConstants')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('Group details factory', () => {
  const getGroupDetailsApi = jest.fn()
  const deleteChildGroupApi = jest.fn()
  const groupDetails = groupDetailsFactory(getGroupDetailsApi, deleteChildGroupApi, '/manage-groups')
  const session = { userDetails: { username: 'some username' } }

  beforeEach(() => {
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
    jest.clearAllMocks()
  })

  describe('index', () => {
    it('should call group details render', async () => {
      const req = { params: { group: 'G1' }, flash: jest.fn(), session }
      getGroupDetailsApi.mockResolvedValue([
        {
          groupName: 'name',
          groupCode: 'code',
          assignableRoles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
          children: [{ groupName: 'groupName4', groupCode: 'groupCode4' }],
        },
      ])

      const render = jest.fn()
      await groupDetails.index(req, { render })
      expect(render).toBeCalledWith('groupDetails.njk', {
        groupDetails: [
          {
            groupName: 'name',
            groupCode: 'code',
            assignableRoles: [{ roleName: 'roleName1', roleCode: 'roleCode1' }],
            children: [{ groupName: 'groupName4', groupCode: 'groupCode4' }],
          },
        ],
        maintainUrl: '/manage-groups',
        hasMaintainAuthUsers: false,
      })

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.VIEW_GROUP_DETAILS_ATTEMPT,
        correlationId: expect.stringMatching(UUID_REGEX),
        who: 'some username',
        details: null,
        subjectId: 'G1',
        subjectType: ManageUsersSubjectType.GROUP_CODE,
        service: 'hmpps-manage-users',
      })
    })

    it('should redirect to manage groups if group does not exist', async () => {
      const error = {
        ...new Error('Does not exist error'),
        status: 404,
        response: { body: { error_description: 'not valid' } },
      }

      const req = { params: { group: 'DOES_NOT_EXIST' }, flash: jest.fn(), session }
      const redirect = jest.fn()
      getGroupDetailsApi.mockRejectedValue(error)

      await groupDetails.index(req, { redirect })
      expect(req.flash).toBeCalledWith('groupError', [{ href: '#groupCode', text: 'Group does not exist' }])
      expect(redirect).toBeCalledWith('/manage-groups')
    })

    it('should publish attempt and failure audit messages when groupDetails render fails', async () => {
      const req = { params: { group: 'G1' }, flash: jest.fn(), session }
      getGroupDetailsApi.mockRejectedValue(new Error('Error for test'))
      const render = jest.fn()

      try {
        await groupDetails.index(req, { render })
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toEqual('Error for test')
      }

      expect(render).not.toHaveBeenCalled()
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.VIEW_GROUP_DETAILS_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.VIEW_GROUP_DETAILS_FAILURE),
      )
    })
  })

  describe('delete child group', () => {
    it('should remove group and redirect', async () => {
      const req = { params: { pgroup: 'JOE', group: 'GROUP1' }, session }

      const redirect = jest.fn()
      const locals = jest.fn()
      await groupDetails.deleteChildGroup(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-groups/JOE')
      expect(deleteChildGroupApi).toBeCalledWith(locals, 'GROUP1')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DELETE_GROUP_ATTEMPT))
    })
  })
})
