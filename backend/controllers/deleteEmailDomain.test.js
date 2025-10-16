const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { deleteEmailDomainFactory } = require('./deleteEmailDomain')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('delete email domain factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const deleteEmailDomainApi = jest.fn()
  const emailDomainFactory = deleteEmailDomainFactory(deleteEmailDomainApi, '/email-domains')
  describe('index', () => {
    it('should call delete email domain render on landing on the page', async () => {
      const standardReq = {
        query: { id: '1234', name: 'domain1' },
        flash: jest.fn(),
      }
      const req = { flash: jest.fn() }
      req.flash('domain')
      const render = jest.fn()
      await emailDomainFactory.index(standardReq, { render })
      expect(render).toHaveBeenCalledWith('deleteEmailDomain.njk', {
        domainId: '1234',
        domainName: 'domain1',
        listEmailDomainsUrl: '/email-domains',
        errors: undefined,
      })
    })
  })

  describe('delete email domain', () => {
    const session = { userDetails: { username: 'username' } }
    it('should delete email domain and redirect to the email domain listing page', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const deleteEmailDomainRequest = {
        body: {
          domainId: '1234',
          domainName: 'test.com',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.deleteEmailDomain(deleteEmailDomainRequest, { locals, redirect })
      expect(deleteEmailDomainApi).toHaveBeenCalledWith(locals, '1234')
      expect(redirect).toHaveBeenCalledWith('/email-domains')
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.DELETE_EMAIL_DOMAIN_ATTEMPT,
        details: '{"name":"test.com"}',
        subjectId: '1234',
        subjectType: ManageUsersSubjectType.EMAIL_DOMAIN_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should fail gracefully, if user is Unauthorized to use the delete email domain functionality', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 401,
        response: {
          body: {
            error_description: 'Unauthorized to use the delete email domain functionality',
          },
        },
      }

      deleteEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainId: '1234',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.deleteEmailDomain(req, { locals, redirect })
      expect(redirect).toHaveBeenCalledWith('/email-domains')
      expect(req.flash).toHaveBeenCalledWith('deleteEmailDomainErrors', [
        { href: '#domainName', text: 'Unauthorized to use the delete email domain functionality' },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.DELETE_EMAIL_DOMAIN_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.DELETE_EMAIL_DOMAIN_FAILURE),
      )
    })

    it('should fail gracefully, if the email domain to be deleted is not found', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 404,
        response: {
          body: {
            error_description: 'Email domain not found',
          },
        },
      }

      deleteEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainId: '1234',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.deleteEmailDomain(req, { locals, redirect })
      expect(redirect).toHaveBeenCalledWith('/email-domains')
      expect(req.flash).toHaveBeenCalledWith('deleteEmailDomainErrors', [
        {
          href: '#domainName',
          text: 'Email domain not found',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.DELETE_EMAIL_DOMAIN_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.DELETE_EMAIL_DOMAIN_FAILURE),
      )
    })
  })
})
