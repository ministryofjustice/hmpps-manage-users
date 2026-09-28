import { asUser, RestClient, SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { Response } from 'superagent'
import {
  BulkUserRoleAdditionsJobDetails,
  BulkUserRoleAdditionsJobSummary,
  BulkUserRoleAdditionsRequest,
  BulkUserRoleAdditionsResponse,
  ChildGroup,
  CreateChildGroupRequest,
  CreateEmailDomainRequest,
  CreateExternalUserRequest,
  CreateGroupRequest,
  CreateLinkedCentralAdminRequest,
  CreateLinkedGeneralUserRequest,
  CreateLinkedLocalAdminRequest,
  CreateRoleRequest,
  CreateUserRequest,
  DpsUserSearchQuery,
  EmailAddress,
  EmailDomain,
  ExternalUser,
  ExternalUserRole,
  Group,
  NotificationMessage,
  PagedList,
  PrisonAdminUserSummary,
  PrisonCaseload,
  PrisonStaffNewUser,
  PrisonStaffUser,
  PrisonUserDetails,
  PrisonUserDownloadSummary,
  PrisonUserSearchSummary,
  Role,
  RoleSearchQuery,
  UpdateGroupNameRequest,
  UpdateRoleAdminTypeRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleNameRequest,
  UpdateUserEmailRequest,
  User,
  UserAllowlistAddRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
  UserAllowlistQuery,
  UserCaseloadDetail,
  UserEmailAddress,
  UserGroup,
  UserRole,
  UserRoleDetail,
} from 'manageUsersApiClient'
import config from '../config'
import logger from '../../logger'
import { toStringArray } from '../utils/utils'

export interface UploadedCsvFile {
  originalname: string
  buffer: Buffer
}

export default class ManageUsersApiClient extends RestClient {
  constructor() {
    super('Manage Users API', config.apis.manageUsersApi, logger)
  }

  async createBulkUserRoleAdditionsJob(
    token: string,
    bulkJobDetails: BulkUserRoleAdditionsRequest,
    userCsv: UploadedCsvFile,
  ): Promise<BulkUserRoleAdditionsResponse> {
    return this.post(
      {
        path: '/bulk-jobs/user-role-additions',
        files: {
          bulkJobDetails: {
            buffer: Buffer.from(JSON.stringify(bulkJobDetails)),
            originalname: 'bulkJobDetails.json',
          },
          userCsv: {
            buffer: userCsv.buffer,
            originalname: userCsv.originalname,
          },
        },
      },
      asUser(token),
    )
  }

  async getBulkUserRoleAdditionsJobs(
    token: string,
    { pageNumber, pageSize, search }: { pageNumber: number; pageSize: number; search?: string },
  ): Promise<PagedList<BulkUserRoleAdditionsJobSummary>> {
    return this.get({ path: '/bulk-jobs/user-role-additions', query: { pageNumber, pageSize, search } }, asUser(token))
  }

  async getBulkUserRoleAdditionsJob(token: string, id: string): Promise<BulkUserRoleAdditionsJobDetails> {
    return this.get({ path: `/bulk-jobs/user-role-additions/${id}` }, asUser(token))
  }

  async downloadBulkUserRoleAdditionsJobCsv(token: string, id: string): Promise<Response> {
    return this.get<Response>({ path: `/bulk-jobs/user-role-additions/${id}/download`, raw: true }, asUser(token))
  }

  async createEmailDomain(token: string, domain: CreateEmailDomainRequest): Promise<EmailDomain> {
    return this.post({ path: '/email-domains', data: domain }, asUser(token))
  }

  async getEmailDomain(token: string, domainId: string): Promise<EmailDomain> {
    return this.get({ path: `/email-domains/${domainId}` }, asUser(token))
  }

  async deleteEmailDomain(token: string, domainId: string): Promise<Response> {
    return this.delete({ path: `/email-domains/${domainId}` }, asUser(token))
  }

  async getAllEmailDomains(token: string): Promise<EmailDomain[]> {
    return this.get({ path: '/email-domains' }, asUser(token))
  }

  async createExternalUser(token: string, user: CreateExternalUserRequest): Promise<string> {
    return this.post<Response>({ path: '/externalusers/create', data: user, raw: true }, asUser(token)).then(
      response => response.text,
    )
  }

  async getUsersInCRSGroup(token: string, groupCode: string): Promise<ExternalUser[]> {
    return this.get({ path: `/externalusers/crsgroup/${groupCode}` }, asUser(token))
  }

  async getUser(token: string, userId: string): Promise<ExternalUser> {
    return this.get({ path: `/externalusers/id/${userId}` }, asUser(token))
  }

  async assignableGroups(token: string): Promise<UserGroup[]> {
    return this.get({ path: '/externalusers/me/assignable-groups' }, asUser(token))
  }

  async searchableRoles(token: string): Promise<UserRole[]> {
    return this.get({ path: '/externalusers/me/searchable-roles' }, asUser(token))
  }

  async userSearch(
    token: string,
    { nameFilter, role, group, status }: { nameFilter?: string; role?: string; group?: string; status?: string },
    page?: number,
    size?: number,
  ): Promise<PagedList<ExternalUser>> {
    const groups = toStringArray(group)
    const roles = toStringArray(role)
    const query = {
      name: nameFilter,
      groups,
      roles,
      status,
      page,
      size,
    }
    return this.get({ path: '/externalusers/search', query }, asUser(token))
  }

  async assignableRoles(token: string, userId: string): Promise<UserRole[]> {
    return this.get({ path: `/externalusers/${userId}/assignable-roles` }, asUser(token))
  }

  async deactivateExternalUser(token: string, userId: string, reason: string): Promise<Response> {
    return this.put({ path: `/externalusers/${userId}/disable`, data: { reason } }, asUser(token))
  }

  async disableExternalUser(token: string, userId: string): Promise<Response> {
    return this.put({ path: `/externalusers/${userId}/disable`, data: undefined }, asUser(token))
  }

  async amendUserEmail(token: string, userId: string, email: UpdateUserEmailRequest): Promise<Response> {
    return this.post({ path: `/externalusers/${userId}/email`, data: email }, asUser(token))
  }

  async enableExternalUser(token: string, userId: string): Promise<Response> {
    return this.put({ path: `/externalusers/${userId}/enable`, data: undefined }, asUser(token))
  }

  async addUserGroup(token: string, userId: string, group: string): Promise<Response> {
    return this.put({ path: `/externalusers/${userId}/groups/${group}`, data: undefined }, asUser(token))
  }

  async removeUserGroup(token: string, userId: string, group: string): Promise<Response> {
    return this.delete({ path: `/externalusers/${userId}/groups/${group}` }, asUser(token))
  }

  async userGroups(token: string, userId: string): Promise<UserGroup[]> {
    return this.get({ path: `/externalusers/${userId}/groups`, query: { children: false } }, asUser(token))
  }

  async externalUserAddRoles(token: string, userId: string, roles: string[]): Promise<Response> {
    return this.post({ path: `/externalusers/${userId}/roles`, data: roles }, asUser(token))
  }

  async externalUserRoles(token: string, userId: string): Promise<UserRole[]> {
    return this.get({ path: `/externalusers/${userId}/roles` }, asUser(token))
  }

  async deleteExternalUserRole(token: string, userId: string, role: string): Promise<Response> {
    return this.delete({ path: `/externalusers/${userId}/roles/${role}` }, asUser(token))
  }

  async createChildGroup(token: string, group: CreateChildGroupRequest): Promise<Response> {
    return this.post({ path: '/groups/child', data: group }, asUser(token))
  }

  async changeChildGroupName(token: string, group: string, groupName: UpdateGroupNameRequest): Promise<Response> {
    return this.put({ path: `/groups/child/${group}`, data: groupName }, asUser(token))
  }

  async childGroupDetails(token: string, group: string): Promise<ChildGroup> {
    return this.get({ path: `/groups/child/${group}` }, asUser(token))
  }

  async deleteChildGroup(token: string, group: string): Promise<Response> {
    return this.delete({ path: `/groups/child/${group}` }, asUser(token))
  }

  async createGroup(token: string, group: CreateGroupRequest): Promise<Response> {
    return this.post({ path: '/groups', data: group }, asUser(token))
  }

  async changeGroupName(token: string, group: string, groupName: UpdateGroupNameRequest): Promise<Response> {
    return this.put({ path: `/groups/${group}`, data: groupName }, asUser(token))
  }

  async deleteGroup(token: string, group: string): Promise<Response> {
    return this.delete({ path: `/groups/${group}` }, asUser(token))
  }

  async groupDetails(token: string, group: string): Promise<Group> {
    return this.get({ path: `/groups/${group}` }, asUser(token))
  }

  async getAllCRSGroups(token: string): Promise<UserGroup[]> {
    return this.get({ path: '/groups/subset/crs' }, asUser(token))
  }

  async createLinkedCentralAdminUser(token: string, user: CreateLinkedCentralAdminRequest): Promise<PrisonStaffUser> {
    return this.post({ path: '/linkedprisonusers/admin', data: user }, asUser(token))
  }

  async createLinkedGeneralUser(token: string, user: CreateLinkedGeneralUserRequest): Promise<PrisonStaffUser> {
    return this.post({ path: '/linkedprisonusers/general', data: user }, asUser(token))
  }

  async createLinkedLsaUser(token: string, user: CreateLinkedLocalAdminRequest): Promise<PrisonStaffUser> {
    return this.post({ path: '/linkedprisonusers/lsa', data: user }, asUser(token))
  }

  async getNotificationBannerMessage(token: string, notificationType: string): Promise<NotificationMessage> {
    return this.get({ path: `/notification/banner/${notificationType}` }, asUser(token))
  }

  async createUser(token: string, user: CreateUserRequest): Promise<PrisonStaffNewUser> {
    return this.post({ path: '/prisonusers', data: user }, asUser(token))
  }

  async downloadLsaSearch(token: string, query: DpsUserSearchQuery): Promise<PrisonAdminUserSummary[]> {
    return this.get(
      {
        path: '/prisonusers/download/admins',
        query,
      },
      asUser(token),
    )
  }

  async downloadUserSearch(token: string, query: DpsUserSearchQuery): Promise<PrisonUserDownloadSummary[]> {
    return this.get(
      {
        path: '/prisonusers/download',
        query,
      },
      asUser(token),
    )
  }

  async getCaseloads(token: string): Promise<PrisonCaseload[]> {
    return this.get({ path: '/prisonusers/reference-data/caseloads' }, asUser(token))
  }

  async dpsUserSearch(
    token: string,
    {
      nameFilter,
      accessRoles,
      status,
      caseload,
      activeCaseload,
      inclusiveRoles,
      showOnlyLSAs,
      size = 20,
      page = 0,
    }: DpsUserSearchQuery,
  ): Promise<PagedList<PrisonUserSearchSummary>> {
    const query = {
      nameFilter,
      accessRoles,
      status,
      caseload,
      activeCaseload,
      inclusiveRoles,
      showOnlyLSAs,
      page,
      size,
    }
    return this.get(
      {
        path: '/prisonusers/search',
        query,
      },
      asUser(token),
    )
  }

  async addUserCaseloads(token: string, username: string, caseloads: string[]): Promise<UserCaseloadDetail> {
    return this.post({ path: `/prisonusers/${username}/caseloads`, data: caseloads }, asUser(token))
  }

  async removeUserCaseload(token: string, username: string, caseloadId: string): Promise<UserCaseloadDetail> {
    return this.delete({ path: `/prisonusers/${username}/caseloads/${caseloadId}` }, asUser(token))
  }

  async currentUserCaseloads(token: string, authSource: string, username: string): Promise<UserCaseloadDetail> {
    return authSource !== 'auth' ? this.getUserCaseloads(token, username) : {}
  }

  async getUserCaseloads(token: string, username: string): Promise<UserCaseloadDetail> {
    return this.get({ path: `/prisonusers/${username}/caseloads` }, asUser(token))
  }

  async disablePrisonUser(token: string, username: string): Promise<Response> {
    return this.put({ path: `/prisonusers/${username}/disable-user`, data: undefined }, asUser(token))
  }

  async getDpsUser(token: string, username: string): Promise<PrisonUserDetails> {
    return this.get({ path: `/prisonusers/${username}/details` }, asUser(token))
  }

  async changeDpsEmail(token: string, username: string, email: string): Promise<string> {
    // First get the raw Response, then return the text rather than the body
    return this.post<Response>(
      { path: `/prisonusers/${username}/email`, data: { email }, raw: true },
      asUser(token),
    ).then(response => response.text)
  }

  async enablePrisonUser(token: string, username: string): Promise<Response> {
    return this.put({ path: `/prisonusers/${username}/enable-user`, data: undefined }, asUser(token))
  }

  async syncDpsEmail(token: string, username: string): Promise<Response> {
    return this.post({ path: `/prisonusers/${username}/email/sync`, data: undefined }, asUser(token))
  }

  async addDpsUserRoles(token: string, username: string, roles: string[]): Promise<UserRoleDetail> {
    return this.post({ path: `/prisonusers/${username}/roles`, data: roles }, asUser(token))
  }

  async getDpsUserRoles(token: string, username: string): Promise<UserRoleDetail> {
    return this.get({ path: `/prisonusers/${username}/roles` }, asUser(token))
  }

  async removeDpsUserRole(token: string, username: string, roleCode: string): Promise<UserRoleDetail> {
    return this.delete({ path: `/prisonusers/${username}/roles/${roleCode}` }, asUser(token))
  }

  async createRole(token: string, role: CreateRoleRequest): Promise<Response> {
    return this.post({ path: '/roles', data: role }, asUser(token))
  }

  async getRoles(token: string, adminType: string): Promise<Role[]> {
    return this.get({ path: '/roles', query: { adminTypes: adminType } }, asUser(token))
  }

  async getPagedRoles(
    token: string,
    { roleName, roleCode, adminTypes, size = 20, page = 0 }: RoleSearchQuery,
  ): Promise<PagedList<Role>> {
    const query = {
      page,
      size,
      roleName,
      roleCode,
      adminTypes,
    }
    return this.get({ path: '/roles/paged', query }, asUser(token))
  }

  async getRoleDetails(token: string, roleCode: string): Promise<Role> {
    return this.get({ path: `/roles/${roleCode}` }, asUser(token))
  }

  async changeRoleName(token: string, roleCode: string, roleName: UpdateRoleNameRequest): Promise<Response> {
    return this.put({ path: `/roles/${roleCode}`, data: roleName }, asUser(token))
  }

  async changeRoleAdminType(token: string, role: string, adminType: UpdateRoleAdminTypeRequest): Promise<Response> {
    return this.put({ path: `/roles/${role}/admintype`, data: adminType }, asUser(token))
  }

  async changeRoleDescription(
    token: string,
    role: string,
    roleDescription: UpdateRoleDescriptionRequest,
  ): Promise<Response> {
    return this.put({ path: `/roles/${role}/description`, data: roleDescription }, asUser(token))
  }

  async addAllowlistUser(token: string, request: UserAllowlistAddRequest): Promise<Response> {
    return this.post({ path: '/users/allowlist', data: request }, asUser(token))
  }

  async getAllAllowlistUsers(
    token: string,
    query: UserAllowlistQuery = { status: 'ALL', size: 20, page: 0 },
  ): Promise<PagedList<UserAllowlistDetail>> {
    return this.get({ path: '/users/allowlist', query }, asUser(token))
  }

  async updateAllowlistUserAccess(
    token: string,
    id: string,
    updateRequest: UserAllowlistPatchRequest,
  ): Promise<Response> {
    return this.patch({ path: `/users/allowlist/${id}`, data: updateRequest }, asUser(token))
  }

  async getAllowlistUser(token: string, username: string): Promise<UserAllowlistDetail> {
    return this.get({ path: `/users/allowlist/${username}` }, asUser(token))
  }

  async currentUser(token: string): Promise<User> {
    return this.get({ path: '/users/me' }, asUser(token))
  }

  async currentRoles(token: string): Promise<ExternalUserRole[]> {
    return this.get({ path: '/users/me/roles' }, asUser(token))
  }

  async getUserEmail(token: string, username: string): Promise<UserEmailAddress> {
    const emailAddress = await this.get<EmailAddress>(
      {
        path: `/users/${username}/email`,
        query: { unverified: true },
        errorHandler: <Response, ERROR>(_path: string, _verb: string, error: SanitisedError<ERROR>): Response => {
          if (error.responseStatus === 404) {
            return { username, email: '', verified: false } as Response
          }
          throw error
        },
      },
      asUser(token),
    )
    return { ...emailAddress, email: emailAddress.email ?? '' }
  }
}
