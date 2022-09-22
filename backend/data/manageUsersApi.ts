import config from '../config'
import RestClient from './restClient'

interface AdminType {
  adminTypeName: string
  adminTypeCode: string
}

interface RoleDetails {
  roleName: string
  roleCode: string
  adminType: Array<AdminType>
}

class ManageUsersApi extends RestClient {
  constructor(token: string) {
    super('Manage Users API', config.apis.manageusers, token)
  }

  getRoleDetails(roleCode: string): Promise<RoleDetails> {
    return this.get({
      path: `/roles/${roleCode}`,
    }) as Promise<RoleDetails>
  }
}

export { ManageUsersApi, RoleDetails }
