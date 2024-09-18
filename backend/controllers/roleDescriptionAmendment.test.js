const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { roleDescriptionAmendmentFactory } = require('./roleDescriptionAmendment')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')
const config = require('../config')

describe('role amendment factory', () => {
  const getRoleDetailsApi = jest.fn()
  const changeRoleDescriptionApi = jest.fn()
  const changeRoleDescription = roleDescriptionAmendmentFactory(
    getRoleDetailsApi,
    changeRoleDescriptionApi,
    '/manage-roles',
  )

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call roleDescription render', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn() }
      getRoleDetailsApi.mockResolvedValue({
        roleDescription: 'role description',
        roleName: 'Auth Group Manager',
      })

      const render = jest.fn()
      await changeRoleDescription.index(req, { render })
      expect(render).toBeCalledWith('changeRoleDescription.njk', {
        currentRoleDescription: 'role description',
        title: 'Change role description for Auth Group Manager',
        roleUrl: '/manage-roles/role1',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { role: 'role1' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getRoleDetailsApi.mockResolvedValue({
        roleDescription: 'role description',
        roleName: 'Auth Group Manager',
      })

      const render = jest.fn()
      await changeRoleDescription.index(req, { render })
      expect(render).toBeCalledWith('changeRoleDescription.njk', {
        errors: { error: 'some error' },
        currentRoleDescription: 'role description',
        title: 'Change role description for Auth Group Manager',
        roleUrl: '/manage-roles/role1',
      })
    })
  })

  describe('post', () => {
    const session = { userDetails: { username: 'username' } }
    beforeEach(() => {
      getRoleDetailsApi.mockResolvedValue({
        roleDescription: 'role description',
        roleName: 'Auth Group Manager',
      })
    })

    it('should change the role description and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: 'RoleADesc' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', 'RoleADesc')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.UPDATE_ROLE_ATTEMPT,
        details: JSON.stringify({ role: 'role1', newRoleDescription: 'RoleADesc' }),
        subjectId: 'role1',
        subjectType: ManageUsersSubjectType.ROLE_CODE,
        who: 'username',
        service: config.default.productId,
        correlationId: expect.any(String),
      })
    })

    it('should trim, change the role description and redirect', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: ' RoleADesc ' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', 'RoleADesc')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_ATTEMPT))
    })

    it('should stash the role description and redirect if role description is empty', async () => {
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: '' },
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeRoleDescription.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-roles/role1')
      expect(changeRoleDescriptionApi).toBeCalledWith(locals, 'role1', '')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_ATTEMPT))
    })

    it('should not change the role description and redirect if no role description entered', async () => {
      const req = {
        params: { role: 'role1' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }
      changeRoleDescriptionApi.mockRejectedValue(error)

      const redirect = jest.fn()
      await changeRoleDescription.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeRoleDescription', [undefined])
      expect(req.flash).toBeCalledWith('changeRoleErrors', [
        {
          href: '#roleDescription',
          text: undefined,
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_FAILURE))
    })

    it('should fail gracefully if role description not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      changeRoleDescriptionApi.mockRejectedValue(error)
      const req = {
        params: { role: 'role1' },
        body: { roleDescription: 'RoleADesc' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeRoleDescription.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeRoleDescription', ['RoleADesc'])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.UPDATE_ROLE_FAILURE))
    })
  })
})
