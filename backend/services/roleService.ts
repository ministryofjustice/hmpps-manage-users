import { ManageUsersApi, RoleDetails } from '../data/manageUsersApi'

export default class RoleService {
  private readonly manageUsersApi: ManageUsersApi

  constructor(systemToken: string) {
    this.manageUsersApi = new ManageUsersApi(systemToken)
  }

  getRoleDetails(roleCode: string): Promise<RoleDetails> {
    return this.manageUsersApi.getRoleDetails(roleCode)
  }
}
