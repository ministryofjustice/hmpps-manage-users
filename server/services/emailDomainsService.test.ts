import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import EmailDomainsService from './emailDomainsService'

jest.mock('../data/manageUsersApiClient')

describe('EmailDomainsService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: EmailDomainsService

  beforeEach(() => {
    apiClient = {
      getAllEmailDomains: jest.fn(),
      getEmailDomain: jest.fn(),
      createEmailDomain: jest.fn(),
      deleteEmailDomain: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new EmailDomainsService(apiClient)
  })

  const token = 'test-token'

  it('gets all email domains', async () => {
    const emailDomains = [
      {
        id: 'test-domain-1',
        domain: 'test.justice.gov.uk',
        description: 'test justice domain',
      },
      {
        id: 'test-domain-2',
        domain: 'test.police.uk',
        description: 'test police domain',
      },
    ]

    apiClient.getAllEmailDomains.mockResolvedValue(emailDomains)

    const result = await service.getAllEmailDomains(token)

    expect(apiClient.getAllEmailDomains).toHaveBeenCalledWith(token)
    expect(result).toBe(emailDomains)
  })

  it('gets an email domain', async () => {
    const emailDomain = {
      id: 'test-domain-1',
      domain: 'test.justice.gov.uk',
      description: 'test justice domain',
    }

    apiClient.getEmailDomain.mockResolvedValue(emailDomain)

    const result = await service.getEmailDomain(token, 'test-domain-1')

    expect(apiClient.getEmailDomain).toHaveBeenCalledWith(token, 'test-domain-1')
    expect(result).toBe(emailDomain)
  })

  it('deletes an email domain', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.deleteEmailDomain.mockResolvedValue(response)

    const result = await service.deleteEmailDomain(token, 'test-domain-1')

    expect(apiClient.deleteEmailDomain).toHaveBeenCalledWith(token, 'test-domain-1')
    expect(result).toBe(response)
  })

  it('creates an email domain', async () => {
    const emailDomain = {
      id: 'test-domain-1',
      domain: 'test.justice.gov.uk',
      description: 'test justice domain',
    }

    const request = {
      name: 'test.justice.gov.uk',
      description: 'test justice domain',
    }

    apiClient.createEmailDomain.mockResolvedValue(emailDomain)

    const result = await service.createEmailDomain(token, request)

    expect(apiClient.createEmailDomain).toHaveBeenCalledWith(token, request)
    expect(result).toBe(emailDomain)
  })
})
