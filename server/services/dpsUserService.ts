import { Response } from 'superagent'
import {
  CreateUserRequest,
  DpsUserSearchQuery,
  PagedList,
  PrisonAdminUserSummary,
  PrisonCaseload,
  PrisonStaffNewUser,
  PrisonUserDetails,
  PrisonUserDownloadSummary,
  PrisonUserSearchSummary,
  UserCaseloadDetail,
  UserRoleDetail,
} from 'manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { CreateLinkedDpsUserRequest } from '../interfaces/createLinkedDpsUserRequest'

export default class DpsUserService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  createDpsUser = async (token: string, request: CreateUserRequest): Promise<PrisonStaffNewUser> =>
    this.manageUsersApiClient.createUser(token, request)

  addCaseloads = async (token: string, username: string, caseloads: string[]): Promise<UserCaseloadDetail> =>
    this.manageUsersApiClient.addUserCaseloads(token, username, caseloads)

  getCaseloads = async (token: string): Promise<PrisonCaseload[]> => this.manageUsersApiClient.getCaseloads(token)

  getUserCaseloads = async (token: string, username: string): Promise<UserCaseloadDetail> =>
    this.manageUsersApiClient.getUserCaseloads(token, username)

  removeCaseload = async (token: string, username: string, caseload: string): Promise<UserCaseloadDetail> =>
    this.manageUsersApiClient.removeUserCaseload(token, username, caseload)

  getDpsUser = async (token: string, username: string, syncEmail: boolean = false): Promise<PrisonUserDetails> => {
    if (syncEmail) {
      await this.syncEmail(token, username)
    }
    return this.manageUsersApiClient.getDpsUser(token, username)
  }

  createLinkedDpsUser = async (token: string, request: CreateLinkedDpsUserRequest): Promise<string> => {
    switch (request.userType) {
      case 'DPS_ADM': {
        return this.manageUsersApiClient
          .createLinkedCentralAdminUser(token, {
            existingUsername: request.existingUsername,
            adminUsername: request.username,
          })
          .then(user => user.adminAccount.username)
      }
      case 'DPS_LSA': {
        return this.manageUsersApiClient
          .createLinkedLsaUser(token, {
            existingUsername: request.existingUsername,
            adminUsername: request.username,
            localAdminGroup: request.defaultCaseloadId,
          })
          .then(user => user.adminAccount.username)
      }
      default: {
        return this.manageUsersApiClient
          .createLinkedGeneralUser(token, {
            existingAdminUsername: request.existingUsername,
            generalUsername: request.username,
            defaultCaseloadId: request.defaultCaseloadId,
          })
          .then(user => user.generalAccount.username)
      }
    }
  }

  dpsUserSearch = async (token: string, query: DpsUserSearchQuery): Promise<PagedList<PrisonUserSearchSummary>> =>
    this.manageUsersApiClient.dpsUserSearch(token, query)

  downloadUserSearch = async (token: string, query: DpsUserSearchQuery): Promise<PrisonUserDownloadSummary[]> =>
    this.manageUsersApiClient.downloadUserSearch(token, query)

  downloadLsaSearch = async (token: string, query: DpsUserSearchQuery): Promise<PrisonAdminUserSummary[]> =>
    this.manageUsersApiClient.downloadLsaSearch(token, query)

  addRoles = async (token: string, username: string, roles: string[]): Promise<UserRoleDetail> =>
    this.manageUsersApiClient.addDpsUserRoles(token, username, roles)

  getRoles = async (token: string, username: string): Promise<UserRoleDetail> =>
    this.manageUsersApiClient.getDpsUserRoles(token, username)

  removeRole = async (token: string, username: string, roleCode: string): Promise<UserRoleDetail> =>
    this.manageUsersApiClient.removeDpsUserRole(token, username, roleCode)

  syncEmail = async (token: string, username: string): Promise<Response> =>
    this.manageUsersApiClient.syncDpsEmail(token, username)

  changeEmail = async (token: string, username: string, email: string): Promise<string> =>
    this.manageUsersApiClient.changeDpsEmail(token, username, email)

  enableUser = async (token: string, username: string): Promise<Response> =>
    this.manageUsersApiClient.enablePrisonUser(token, username)

  disableUser = async (token: string, username: string): Promise<Response> =>
    this.manageUsersApiClient.disablePrisonUser(token, username)
}
