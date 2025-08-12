import config from '../config'
import RestClient from './restClient'
import {
  PrisonUserDetails,
  Role,
  UserAllowlistAddRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
} from '../@types/manageUsersApi'
import { PagedList } from '../interfaces/pagedList'

interface AdminType {
  adminTypeName: string
  adminTypeCode: string
}

interface RoleDetails {
  roleName: string
  roleCode: string
  adminType: Array<AdminType>
}

export interface UserAllowlistQuery {
  name?: string
  status: string
  size: number
  page: number
}

class ManageUsersApiClient extends RestClient {
  constructor(token: string) {
    super('Manage Users API', config.apis.manageUsers, token)
  }

  getRoleDetails(roleCode: string): Promise<RoleDetails> {
    return this.get({
      path: `/roles/${roleCode}`,
    }) as Promise<RoleDetails>
  }

  async getRoles(adminType: string): Promise<Role[]> {
    return this.get<Role[]>({
      path: `/roles?adminTypes=${adminType}`,
    })
  }

  async getDpsUser(username: string): Promise<PrisonUserDetails> {
    return this.get<PrisonUserDetails>({
      path: `/prisonusers/${username}/details`,
    })
  }

  async addAllowlistUser(request: UserAllowlistAddRequest): Promise<Response> {
    return this.post<Response>({
      path: '/users/allowlist',
      data: request,
    })
  }

  async getAllAllowlistUsers(
    query: UserAllowlistQuery = { status: 'ALL', size: 20, page: 0 },
  ): Promise<PagedList<UserAllowlistDetail>> {
    return this.get<PagedList<UserAllowlistDetail>>({
      path: '/users/allowlist',
      query,
    })
  }

  async getAllowlistUser(username: string): Promise<UserAllowlistDetail> {
    return this.get<UserAllowlistDetail>({
      path: `/users/allowlist/${username}`,
    })
  }

  async updateAllowlistUserAccess(id: string, updateRequest: UserAllowlistPatchRequest): Promise<Response> {
    return this.patch<Response>({
      path: `/users/allowlist/${id}`,
      data: updateRequest,
    })
  }
}

export { ManageUsersApiClient, RoleDetails }
