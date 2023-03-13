const { deleteEmailDomainFactory } = require('./deleteEmailDomain')

describe('delete email domain factory', () => {
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
      expect(render).toBeCalledWith('deleteEmailDomain.njk', {
        domainId: '1234',
        domainName: 'domain1',
        listEmailDomainsUrl: '/email-domains',
        errors: undefined,
      })
    })
  })

  describe('delete email domain', () => {
    it('should delete email domain and redirect to the email domain listing page', async () => {
      const redirect = jest.fn()
      const locals = jest.fn()
      const deleteEmailDomainRequest = {
        body: {
          domainId: '1234',
        },
        flash: jest.fn(),
        originalUrl: '/email-domains',
      }
      await emailDomainFactory.deleteEmailDomain(deleteEmailDomainRequest, { locals, redirect })
      expect(deleteEmailDomainApi).toBeCalledWith(locals, '1234')
      expect(redirect).toBeCalledWith('/email-domains')
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
      }
      await emailDomainFactory.deleteEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('deleteEmailDomainErrors', [
        { href: '#domainName', text: 'Unauthorized to use the delete email domain functionality' },
      ])
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
      }
      await emailDomainFactory.deleteEmailDomain(req, { locals, redirect })
      expect(redirect).toBeCalledWith('/email-domains')
      expect(req.flash).toBeCalledWith('deleteEmailDomainErrors', [
        {
          href: '#domainName',
          text: 'Email domain not found',
        },
      ])
    })
  })
})
