import { ManageUsersApiClient, RoleDetails } from '../data/manageUsersApiClient'

export default class RoleService {
  private readonly manageUsersApi: ManageUsersApiClient

  constructor(systemToken: string) {
    this.manageUsersApi = new ManageUsersApiClient(systemToken)
  }

  getRoleDetails(roleCode: string): Promise<RoleDetails> {
    return this.manageUsersApi.getRoleDetails(roleCode)
  }
}
