const { createEmailDomainFactory } = require('./addEmailDomain')

describe('create email domain factory', () => {
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
    it('should create email domain and redirect', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const createEmailDomainRequest = {
        body: {
          domainName: 'DOMAIN1',
          domainDescription: 'DOMAINDESCRIPTION1',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
      }
      await emailDomainFactory.createEmailDomain(createEmailDomainRequest, { locals, redirect })
      expect(createEmailDomainApi).toBeCalledWith(locals, { name: 'DOMAIN1', description: 'DOMAINDESCRIPTION1' })
      expect(redirect).toBeCalledWith('/email-domains')
    })

    it('should stash the errors and redirect if no email domain name and description entered', async () => {
      const createEmailDomainRequestNoInput = {
        body: { domainName: '', domainDescription: '' },
        params: {},
        flash: jest.fn(),
        post: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/email-domains',
        session: {},
      }
      const redirect = jest.fn()
      const locals = jest.fn()
      await emailDomainFactory.createEmailDomain(createEmailDomainRequestNoInput, { redirect, locals })
      expect(createEmailDomainRequestNoInput.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Enter a domain name' },
        { href: '#domainDescription', text: 'Enter a domain description' },
      ])
    })

    it('should fail gracefully if Domain already present in the allowed list error is triggered', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { userMessage: 'Domain EXISTINGDOMAIN is already present in the allowed list' } },
      }

      createEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainName: 'EXISTINGDOMAIN',
          domainDescription: 'EXISTING DOMAIN DESCRIPTION',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
      }
      await emailDomainFactory.createEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Domain EXISTINGDOMAIN is already present in the allowed list' },
      ])
    })

    it('should fail gracefully if Domain present in excluded list error is triggered', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { userMessage: 'Domain EXCLUDEDDOMAIN is present in the excluded list' } },
      }

      createEmailDomainApi.mockRejectedValue(error)
      const req = {
        body: {
          domainName: 'EXCLUDEDDOMAIN',
          domainDescription: 'EXCLUDED DOMAIN DESCRIPTION',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
      }
      await emailDomainFactory.createEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('createEmailDomainErrors', [
        { href: '#domainName', text: 'Domain EXCLUDEDDOMAIN is present in the excluded list' },
      ])
    })
  })
})
