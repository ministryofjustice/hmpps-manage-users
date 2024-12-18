const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { roleDetailsFactory } = require('./roleDetails')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')

describe('Role details factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const getRoleDetailsApi = jest.fn()
  const roleDetails = roleDetailsFactory(getRoleDetailsApi, '/manage-roles')
  const session = { userDetails: { username: 'username' } }

  describe('index', () => {
    it('should call role details render', async () => {
      const req = { params: { role: 'R1', roleCode: 'code' }, flash: jest.fn(), session }
      getRoleDetailsApi.mockResolvedValue([
        {
          roleName: 'name',
          roleCode: 'code',
          adminType: [{ adminTypeName: 'LSA', adminTypeCode: 'DPS_LSA' }],
        },
      ])

      const render = jest.fn()
      await roleDetails.index(req, { render })
      expect(render).toBeCalledWith('roleDetails.njk', {
        roleDetails: [
          {
            roleName: 'name',
            roleCode: 'code',
            adminType: [{ adminTypeName: 'LSA', adminTypeCode: 'DPS_LSA' }],
          },
        ],
        maintainUrl: '/manage-roles',
      })

      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.VIEW_ROLE_DETAILS_ATTEMPT,
        details: null,
        subjectId: 'code',
        subjectType: ManageUsersSubjectType.ROLE_CODE,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should redirect to manage roles if role does not exist', async () => {
      const error = {
        ...new Error('Does not exist error'),
        status: 404,
        response: { body: { error_description: 'not valid' } },
      }

      const req = { params: { role: 'DOES_NOT_EXIST' }, flash: jest.fn(), session }
      const redirect = jest.fn()
      getRoleDetailsApi.mockRejectedValue(error)

      await roleDetails.index(req, { redirect })
      expect(req.flash).toBeCalledWith('roleError', [{ href: '#roleCode', text: 'Role does not exist' }])
      expect(redirect).toBeCalledWith('/manage-roles')
    })
  })
})
