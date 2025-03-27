import { RestClientBuilder, ManageUsersApiClient } from '../data'
import { UserAllowlistAddRequest, UserAllowlistDetail, UserAllowlistPatchRequest } from '../@types/manageUsersApi'
import { PagedList } from '../interfaces/pagedList'
import { UserAllowlistQuery } from '../data/manageUsersApiClient'

export default class AllowListService {
  manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>

  constructor(manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>) {
    this.manageUsersApiClientBuilder = manageUsersApiClientBuilder
  }

  public async getAllAllowListUsers(token: string, query: UserAllowlistQuery): Promise<PagedList<UserAllowlistDetail>> {
    const manageUsersApi = this.manageUsersApiClientBuilder(token)
    return manageUsersApi.getAllAllowlistUsers(query)
  }

  public async getAllowListUser(token: string, username: string): Promise<UserAllowlistDetail> {
    const manageUsersApi = this.manageUsersApiClientBuilder(token)
    return manageUsersApi.getAllowlistUser(username)
  }

  public async usernameExists(token: string, username: string): Promise<boolean> {
    try {
      await this.getAllowListUser(token, username)
      return true
    } catch (e) {
      return false
    }
  }

  public async addAllowListUser(token: string, user: UserAllowlistAddRequest): Promise<void> {
    const manageUsersApi = this.manageUsersApiClientBuilder(token)
    await manageUsersApi.addAllowlistUser(user)
  }

  public async updateAllowListUser(token: string, id: string, updateRequest: UserAllowlistPatchRequest): Promise<void> {
    const manageUsersApi = this.manageUsersApiClientBuilder(token)
    await manageUsersApi.updateAllowlistUserAccess(id, updateRequest)
  }
}
