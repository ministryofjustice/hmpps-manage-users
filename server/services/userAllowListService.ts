import {
  PagedList,
  UserAllowlistAddRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
  UserAllowlistQuery,
} from 'manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { HttpStatusCode, isErrorResponse } from '../utils/utils'

export default class UserAllowListService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  getAllowListUser = async (token: string, username: string): Promise<UserAllowlistDetail> =>
    this.manageUsersApiClient.getAllowlistUser(token, username)

  getAllAllowListUsers = async (token: string, query?: UserAllowlistQuery): Promise<PagedList<UserAllowlistDetail>> =>
    this.manageUsersApiClient.getAllAllowlistUsers(token, query)

  usernameExists = async (token: string, username: string): Promise<boolean> => {
    try {
      await this.getAllowListUser(token, username)
      return true
    } catch (err: unknown) {
      if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.NOT_FOUND) {
        return false
      }
      throw err
    }
  }

  addAllowListUser = async (token: string, user: UserAllowlistAddRequest): Promise<void> => {
    await this.manageUsersApiClient.addAllowlistUser(token, user)
  }

  updateAllowListUserAccess = async (
    token: string,
    id: string,
    updateRequest: UserAllowlistPatchRequest,
  ): Promise<void> => {
    await this.manageUsersApiClient.updateAllowlistUserAccess(token, id, updateRequest)
  }
}
