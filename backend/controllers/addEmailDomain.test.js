const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createEmailDomainFactory } = require('./addEmailDomain')
const { ManageUsersEvent } = require('../audit/manageUsersEvent')

describe('create email domain factory', () => {
  let redirect
  let locals

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
    redirect = jest.fn()
    locals = jest.fn()
  })

  const createEmailDomainApi = jest.fn()
  const emailDomainFactory = createEmailDomainFactory(createEmailDomainApi, '/create-email-domain', '/email-domains')
  describe('index', () => {
    it('should call create email domain render', async () => {
      const standardReq = {
        params: {},
        flash: jest.fn(),
      }
      const req = { flash: jest.fn() }
      const flashDomain = req.flash('domain')
      const domain = flashDomain != null && flashDomain.length > 0 ? flashDomain[0] : ''
      const render = jest.fn()
      await emailDomainFactory.index(standardReq, { render })
      expect(render).toBeCalledWith('createEmailDomain.njk', {
        createEmailDomainUrl: '/create-email-domain',
        listEmailDomainUrl: '/email-domains',
        ...domain,
        errors: undefined,
      })

      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should copy any flash errors over', async () => {
      const req = { flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      const flashDomain = req.flash('domain')
      const domain = flashDomain != null && flashDomain.length > 0 ? flashDomain[0] : ''
      const render = jest.fn()
      await emailDomainFactory.index(req, { render })
      expect(render).toBeCalledWith('createEmailDomain.njk', {
        createEmailDomainUrl: '/create-email-domain',
        listEmailDomainUrl: '/email-domains',
        ...domain,
        errors: { error: 'some error' },
      })
    })
  })

  describe('post', () => {
    let session
    let createEmailDomainRequest
    const success = expect.objectContaining({ action: ManageUsersEvent.CREATE_EMAIL_DOMAIN_ATTEMPT })
    const failure = expect.objectContaining({ action: ManageUsersEvent.CREATE_EMAIL_DOMAIN_FAILURE })

    beforeEach(() => {
      session = { userDetails: { username: 'username' } }
      createEmailDomainRequest = {
        body: {
          domainName: 'DOMAIN1',
          domainDescription: 'DOMAINDESCRIPTION1',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
    })

    it('should create email domain and redirect', async () => {
      await emailDomainFactory.createEmailDomain(createEmailDomainRequest, { locals, redirect })
      expect(createEmailDomainApi).toBeCalledWith(locals, { name: 'DOMAIN1', description: 'DOMAINDESCRIPTION1' })
      expect(redirect).toBeCalledWith('/email-domains')

      // Check audit message
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          action: ManageUsersEvent.CREATE_EMAIL_DOMAIN_ATTEMPT,
          details: '{"domain":{"name":"DOMAIN1","description":"DOMAINDESCRIPTION1"}}',
          who: 'username',
          service: 'hmpps-manage-users',
        }),
      )
    })

    it('should stash the errors and redirect if no email domain name and description entered', async () => {
      const createEmailDomainRequestNoInput = {
        body: { domainName: '', domainDescription: '' },
        params: {},
        flash: jest.fn(),
        post: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.createEmailDomain(createEmailDomainRequestNoInput, { redirect, locals })
      expect(createEmailDomainRequestNoInput.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Enter a domain name' },
        { href: '#domainDescription', text: 'Enter a domain description' },
      ])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should fail gracefully if Email Domain already present in the allowed list error is triggered', async () => {
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { userMessage: 'Email domain EXISTINGDOMAIN is already present in the allowed list' } },
      }

      createEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainName: 'EXISTINGDOMAIN',
          domainDescription: 'EXISTING DOMAIN DESCRIPTION',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.createEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Email domain EXISTINGDOMAIN is already present in the allowed list' },
      ])

      // quickly check sendAuditMessage, one for the attempt and one for the failure
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(success)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(failure)
    })

    it('should fail gracefully if Email domain is present in excluded list error is triggered', async () => {
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { userMessage: 'Email domain EXCLUDEDDOMAIN is present in the excluded list' } },
      }

      createEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainName: 'EXCLUDEDDOMAIN',
          domainDescription: 'EXCLUDED DOMAIN DESCRIPTION',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
        session,
      }
      await emailDomainFactory.createEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Email domain EXCLUDEDDOMAIN is present in the excluded list' },
      ])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(success)
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(failure)
    })
  })
})
