import { Response } from 'superagent'
import { CreateEmailDomainRequest, EmailDomain } from 'manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'

export default class EmailDomainsService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  getAllEmailDomains = async (token: string): Promise<EmailDomain[]> =>
    this.manageUsersApiClient.getAllEmailDomains(token)

  getEmailDomain = async (token: string, id: string): Promise<EmailDomain> =>
    this.manageUsersApiClient.getEmailDomain(token, id)

  createEmailDomain = async (token: string, request: CreateEmailDomainRequest): Promise<EmailDomain> =>
    this.manageUsersApiClient.createEmailDomain(token, request)

  deleteEmailDomain = async (token: string, domainId: string): Promise<Response> =>
    this.manageUsersApiClient.deleteEmailDomain(token, domainId)
}
