const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { deactivateUserReasonFactory } = require('./deactivateUserReason')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('deactivate user reason factory', () => {
  const deactivateUserApi = jest.fn()
  const deactivateUser = deactivateUserReasonFactory(
    deactivateUserApi,
    '/manage-external-users',
    'Deactivate user reason',
  )
  const session = { userDetails: { username: 'username' } }
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call deactivateUserReason render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      const render = jest.fn()
      await deactivateUser.index(req, { render })
      expect(render).toBeCalledWith('userDeactivate.njk', {
        title: 'Deactivate user reason',
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        reason: null,
        errors: undefined,
      })
    })
    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      const render = jest.fn()
      await deactivateUser.index(req, { render })
      expect(render).toBeCalledWith('userDeactivate.njk', {
        errors: { error: 'some error' },
        title: 'Deactivate user reason',
        reason: null,
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })
  })

  describe('post', () => {
    it('should deactivate user and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { reason: 'Left' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await deactivateUser.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(deactivateUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'Left')

      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.DEACTIVATE_USER_ATTEMPT,
        details: null,
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })
  })

  it('should fail gracefully if group manager not allowed to maintain user', async () => {
    const redirect = jest.fn()
    const error = { ...new Error('This failed'), status: 403 }
    deactivateUserApi.mockRejectedValue(error)
    await deactivateUser.post(
      {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { group: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      },
      { redirect },
    )
    expect(redirect).toBeCalledWith('/some-location')
    expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.DEACTIVATE_USER_ATTEMPT))
    expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.DEACTIVATE_USER_FAILURE))
  })
})
