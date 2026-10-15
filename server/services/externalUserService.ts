import { CreateExternalUserRequest, ExternalUser, PagedList, UserGroup, UserRole } from 'manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { filterProtectedRoles, HmppsUser } from '../interfaces/hmppsUser'

export default class ExternalUserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  assignableGroups = async (token: string): Promise<UserGroup[]> => this.manageUsersApiClient.assignableGroups(token)

  getUsersInCRSGroup = async (token: string, groupCode: string): Promise<ExternalUser[]> =>
    this.manageUsersApiClient.getUsersInCRSGroup(token, groupCode)

  createExternalUser = async (token: string, user: CreateExternalUserRequest): Promise<string> =>
    this.manageUsersApiClient.createExternalUser(token, user)

  searchUsers = async (
    token: string,
    filter: { nameFilter?: string; role?: string; group?: string; status?: string },
    page?: number,
    size?: number,
  ): Promise<PagedList<ExternalUser>> => this.manageUsersApiClient.userSearch(token, filter, page, size)

  getUser = async (token: string, userId: string): Promise<ExternalUser> =>
    this.manageUsersApiClient.getUser(token, userId)

  getUserRoles = async (token: string, userId: string): Promise<UserRole[]> =>
    this.manageUsersApiClient.externalUserRoles(token, userId)

  getUserGroups = async (token: string, userId: string): Promise<UserGroup[]> =>
    this.manageUsersApiClient.userGroups(token, userId)

  getAssignableRoles = async (user: HmppsUser, userId: string): Promise<UserRole[]> =>
    this.manageUsersApiClient
      .assignableRoles(user.token, userId)
      .then(allAssignableRoles => filterProtectedRoles(user, allAssignableRoles))

  getSearchableRoles = async (token: string): Promise<UserRole[]> => this.manageUsersApiClient.searchableRoles(token)

  addRoles = async (token: string, userId: string, roles: string[]): Promise<void> => {
    await this.manageUsersApiClient.externalUserAddRoles(token, userId, roles)
  }

  removeRole = async (token: string, userId: string, role: string): Promise<void> => {
    await this.manageUsersApiClient.deleteExternalUserRole(token, userId, role)
  }

  addGroup = async (token: string, userId: string, group: string): Promise<void> => {
    await this.manageUsersApiClient.addUserGroup(token, userId, group)
  }

  removeGroup = async (token: string, userId: string, group: string): Promise<void> => {
    await this.manageUsersApiClient.removeUserGroup(token, userId, group)
  }

  changeEmail = async (token: string, userId: string, email: string): Promise<void> => {
    await this.manageUsersApiClient.amendUserEmail(token, userId, { email })
  }

  enableUser = async (token: string, userId: string): Promise<void> => {
    await this.manageUsersApiClient.enableExternalUser(token, userId)
  }

  disableUser = async (token: string, userId: string): Promise<void> => {
    await this.manageUsersApiClient.disableExternalUser(token, userId)
  }

  deactivateUser = async (token: string, userId: string, reason: string): Promise<void> => {
    await this.manageUsersApiClient.deactivateExternalUser(token, userId, reason)
  }
}
