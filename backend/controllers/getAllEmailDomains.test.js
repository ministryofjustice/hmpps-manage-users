const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { viewEmailDomainsFactory } = require('./getAllEmailDomains')
const { auditAction } = require('../utils/testUtils')
const { ManageUsersEvent } = require('../audit')

const allEmailDomains = [
  {
    id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127',
    domain: 'DOMAIN1',
    description: 'DOMAIN 1 DESCRIPTION',
  },
  {
    id: 'acf5e424-2f7c-4bea-ac1e-07d2553f3e63',
    domain: 'DOMAIN2',
    description: 'DOMAIN 2 DESCRIPTION',
  },
  {
    id: '8529edfa-6bcf-462f-ae29-5433a615d405',
    domain: 'DOMAIN3',
    description: 'DOMAIN 3 DESCRIPTION',
  },
]

const noEmailDomains = []
describe('view email domains listing', () => {
  const getEmailDomainsApi = jest.fn()

  const standardReq = {
    params: {},
    flash: jest.fn(),
    get: jest.fn().mockReturnValue('localhost'),
    protocol: 'http',
    originalUrl: '/',
    session: { userDetails: { username: 'username' } },
  }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const mockEmailDomainListingCall = () => {
    getEmailDomainsApi.mockResolvedValue(allEmailDomains)
  }

  const mockNoResultEmailDomainListingCall = () => {
    getEmailDomainsApi.mockResolvedValue(noEmailDomains)
  }

  describe('should list all email domains', () => {
    const getEmailDomainListing = viewEmailDomainsFactory(getEmailDomainsApi)

    it('should call view email domains results render', async () => {
      const reqHappyPath = {
        ...standardReq,
        query: {},
      }
      mockEmailDomainListingCall()
      const render = jest.fn()
      await getEmailDomainListing.index(reqHappyPath, { render })
      expect(render).toBeCalledWith('emailDomainListing.njk', {
        domains: allEmailDomains,
        errors: undefined,
      })
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.LIST_EMAIL_DOMAINS_ATTEMPT))
    })
  })

  describe('should display error if no email domains returned', () => {
    const getEmailDomainListing = viewEmailDomainsFactory(getEmailDomainsApi)

    it('should call view email domains results render with flash error', async () => {
      const reqWithError = {
        ...standardReq,
        query: {},
        flash: jest.fn().mockReturnValue({ error: 'No email domains returned' }),
      }
      mockNoResultEmailDomainListingCall()
      const render = jest.fn()
      await getEmailDomainListing.index(reqWithError, { render })
      expect(render).toBeCalledWith('emailDomainListing.njk', {
        domains: noEmailDomains,
        errors: { error: 'No email domains returned' },
      })
    })
  })
})
