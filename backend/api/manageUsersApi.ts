import superagent from 'superagent'
import * as querystring from 'querystring'

import { Context } from '../interfaces/context'
import { PagedList } from '../interfaces/pagedList'
import { OAuthEnabledClient } from './oauthEnabledClient'
import * as contextProperties from '../contextProperties'
import {
  Role,
  User,
  UserDetails,
  NotificationMessage,
  UpdateRoleNameRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleAdminTypeRequest,
  CreateGroupRequest,
  CreateExternalUserRequest,
  Group,
  UpdateGroupNameRequest,
  CreateChildGroupRequest,
  ChildGroup,
  EmailDomain,
  CreateEmailDomainRequest,
  ExternalUserRole,
  EmailAddress,
  UserRole,
  UserGroup,
  ExternalUser,
  UpdateUserEmailRequest,
  CreateUserRequest,
  CreateLinkedCentralAdminRequest,
  CreateLinkedGeneralUserRequest,
  CreateLinkedLocalAdminRequest,
  PrisonStaffNewUser,
  PrisonStaffUser,
  UserRoleDetail,
  PrisonCaseload,
  UserCaseloadDetail,
} from '../@types/manageUsersApi'

const processPageResponse =
  (context: Context): ((response: superagent.Response) => superagent.Response) =>
  (response: superagent.Response) => {
    if (response.body.pageable) {
      contextProperties.setPageable(context, response.body)
      return response.body.content
    }
    return response.body
  }

export const manageUsersApiFactory = (oauthEnabledClient: OAuthEnabledClient) => {
  const get = (context: Context, path: string) =>
    oauthEnabledClient.get(context, path).then((response) => response.body)
  const post = (context: Context, path: string, body: unknown) =>
    oauthEnabledClient.post(context, path, body).then((response) => response.body)
  const put = (context: Context, path: string, body: unknown) =>
    oauthEnabledClient.put(context, path, body).then((response) => response.body)
  const del = (context: Context, path: string) =>
    oauthEnabledClient.del(context, path).then((response) => response.body)

  const getNotificationBannerMessage = (context: Context, notificationType: string): Promise<NotificationMessage> =>
    get(context, `/notification/banner/${notificationType}`)

  const createRole = (context: Context, role: string): Promise<Response> => post(context, '/roles', role)
  const getRoles = (context: Context, { adminTypes }: { adminTypes: string }): Promise<Role[]> =>
    get(context, `/roles?adminTypes=${adminTypes}`)
  const getPagedRoles = (
    context: Context,
    page: number,
    size: number,
    roleName: string,
    roleCode: string,
    adminType: string,
  ): Promise<PagedList<Role>> => {
    const adminTypes = adminType === 'ALL' ? '' : adminType
    const query = querystring.stringify({
      page,
      size,
      roleName,
      roleCode,
      adminTypes,
    })
    return oauthEnabledClient.get(context, `/roles/paged?${query}`).then(processPageResponse(context)) as Promise<
      PagedList<Role>
    >
  }
  const getRoleDetails = (context: Context, roleCode: string): Promise<Role> => get(context, `/roles/${roleCode}`)
  const changeRoleName = (context: Context, roleCode: string, roleName: UpdateRoleNameRequest) =>
    put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (
    context: Context,
    role: string,
    roleDescription: UpdateRoleDescriptionRequest,
  ): Promise<Response> => put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (
    context: Context,
    role: string,
    adminType: UpdateRoleAdminTypeRequest,
  ): Promise<Response> => put(context, `/roles/${role}/admintype`, adminType)

  const createGroup = (context: Context, group: CreateGroupRequest) => post(context, '/groups', group)
  const createExternalUser = (context: Context, user: CreateExternalUserRequest): Promise<Response> =>
    post(context, `/externalusers/create`, user)
  const groupDetails = (context: Context, { group }: { group: string }): Promise<Group> =>
    get(context, `/groups/${group}`)
  const changeGroupName = (context: Context, group: string, groupName: UpdateGroupNameRequest) =>
    put(context, `/groups/${group}`, groupName)
  const deleteGroup = (context: Context, group: string) => del(context, `/groups/${group}`)

  const createChildGroup = (context: Context, group: CreateChildGroupRequest): Promise<Response> =>
    post(context, '/groups/child', group)
  const childGroupDetails = (context: Context, { group }: { group: string }): Promise<ChildGroup> =>
    get(context, `/groups/child/${group}`)
  const changeChildGroupName = (
    context: Context,
    group: string,
    groupName: UpdateGroupNameRequest,
  ): Promise<Response> => put(context, `/groups/child/${group}`, groupName)
  const deleteChildGroup = (context: Context, group: string): Promise<Response> =>
    del(context, `/groups/child/${group}`)

  const getAllEmailDomains = (context: Context): Promise<PagedList<EmailDomain>> => {
    return oauthEnabledClient.get(context, `/email-domains`).then(processPageResponse(context)) as Promise<
      PagedList<EmailDomain>
    >
  }
  const createEmailDomain = (context: Context, domain: CreateEmailDomainRequest): Promise<Response> =>
    post(context, '/email-domains', domain)
  const deleteEmailDomain = (context: Context, domainId: string): Promise<Response> =>
    del(context, `/email-domains/${domainId}`)

  const currentUser = (context: Context): Promise<User> => get(context, '/users/me')
  const currentRoles = (context: Context): Promise<ExternalUserRole[]> => get(context, '/users/me/roles')
  const getUserEmail = async (context: Context, { username }: { username: string }): Promise<EmailAddress> => {
    try {
      return await get(context, `/users/${username}/email?unverified=true`)
    } catch (error) {
      if (error?.status === 404) return {}
      throw error
    }
  }

  const externalUserAddRoles = (
    context: Context,
    { userId, roles }: { userId: string; roles: string[] },
  ): Promise<Response> => post(context, `/externalusers/${userId}/roles`, roles)
  const externalUserRoles = (context: Context, userId: string): Promise<UserRole[]> =>
    get(context, `/externalusers/${userId}/roles`)
  const deleteExternalUserRole = (
    context: Context,
    { userId, role }: { userId: string; role: string },
  ): Promise<Response> => del(context, `/externalusers/${userId}/roles/${role}`)
  const assignableRoles = (context: Context, { userId }: { userId: string }): Promise<UserRole[]> =>
    get(context, `/externalusers/${userId}/assignable-roles`)
  const searchableRoles = (context: Context): Promise<UserRole[]> => get(context, '/externalusers/me/searchable-roles')

  const assignableGroups = (context: Context): Promise<UserGroup[]> =>
    get(context, '/externalusers/me/assignable-groups')
  const userGroups = (context: Context, { userId }: { userId: string }): Promise<UserGroup[]> =>
    get(context, `/externalusers/${userId}/groups?children=false`)
  const removeUserGroup = (context: Context, { userId, group }: { userId: string; group: string }): Promise<Response> =>
    del(context, `/externalusers/${userId}/groups/${group}`)
  const addUserGroup = (context: Context, { userId, group }: { userId: string; group: string }): Promise<Response> =>
    put(context, `/externalusers/${userId}/groups/${group}`, undefined)

  const getUser = (context: Context, { userId }: { userId: string }): Promise<ExternalUser> =>
    get(context, `/externalusers/id/${userId}`)
  const amendUserEmail = (context: Context, userId: string, email: UpdateUserEmailRequest) =>
    post(context, `/externalusers/${userId}/email`, email)

  const userSearch = (
    context: Context,
    { nameFilter, role, group, status }: { nameFilter?: string; role?: string; group?: string; status?: string },
    page?: number,
    size?: number,
  ): Promise<PagedList<ExternalUser>> => {
    const groups = group ? [group] : null
    const roles = role ? [role] : null
    const query = querystring.stringify({
      name: nameFilter,
      groups,
      roles,
      status,
      page,
      size,
    })
    return oauthEnabledClient
      .get(context, `/externalusers/search?${query}`)
      .then(processPageResponse(context)) as Promise<PagedList<ExternalUser>>
  }
  const enableExternalUser = (context: Context, { userId }: { userId: string }): Promise<Response> =>
    put(context, `/externalusers/${userId}/enable`, undefined)
  const disableExternalUser = (context: Context, { userId }: { userId: string }): Promise<Response> =>
    put(context, `/externalusers/${userId}/disable`, undefined)
  const deactivateExternalUser = (
    context: Context,
    { userId, reason }: { userId: string; reason: string },
  ): Promise<Response> => put(context, `/externalusers/${userId}/disable`, { reason })

  const getDpsUser = (context: Context, username: string): Promise<UserDetails> =>
    get(context, `/prisonusers/${username}/details`)

  const createUser = (context: Context, user: CreateUserRequest): Promise<PrisonStaffNewUser> =>
    post(context, '/prisonusers', user)
  const createLinkedCentralAdminUser = (
    context: Context,
    user: CreateLinkedCentralAdminRequest,
  ): Promise<PrisonStaffUser> => post(context, '/linkedprisonusers/admin', user)
  const createLinkedLsaUser = (context: Context, user: CreateLinkedLocalAdminRequest): Promise<PrisonStaffUser> =>
    post(context, '/linkedprisonusers/lsa', user)
  const createLinkedGeneralUser = (context: Context, user: CreateLinkedGeneralUserRequest): Promise<PrisonStaffUser> =>
    post(context, '/linkedprisonusers/general', user)
  const changeDpsEmail = (context: Context, username: string, email: string): Promise<string> =>
    post(context, `/prisonusers/${username}/email`, email)
  const syncDpsEmail = (context: Context, username: string): Promise<Response> =>
    post(context, `/prisonusers/${username}/email/sync`, null)
  const contextUserRoles = (context: Context, username: string): Promise<UserRoleDetail> =>
    get(context, `/prisonusers/${username}/roles`)

  const enablePrisonUser = (context: Context, username: string): Promise<Response> =>
    put(context, `/prisonusers/${username}/enable-user`, undefined)
  const disablePrisonUser = (context: Context, username: string): Promise<Response> =>
    put(context, `/prisonusers/${username}/disable-user`, undefined)
  const getCaseloads = (context: Context): Promise<PrisonCaseload[]> =>
    get(context, '/prisonusers/reference-data/caseloads')
  const getUserCaseloads = (context: Context, username: string): Promise<UserCaseloadDetail> =>
    get(context, `/prisonusers/${username}/caseloads`)

  // TODO - consult with the team to see if this is the correct return type
  const currentUserCaseloads = (context: Context, username: string): Promise<UserCaseloadDetail> | [] =>
    context.authSource !== 'auth' ? getUserCaseloads(context, username) : []
  const addUserCaseloads = (context: Context, username: string, caseloads: string[]): Promise<UserCaseloadDetail> =>
    post(context, `/prisonusers/${username}/caseloads`, caseloads)
  const removeUserCaseload = (context: Context, username: string, caseloadId: string): Promise<UserCaseloadDetail> =>
    del(context, `/prisonusers/${username}/caseloads/${caseloadId}`)

  const addDpsUserRoles = (context: Context, username: string, roles: string[]): Promise<UserRoleDetail> =>
    post(context, `/prisonusers/${username}/roles`, roles)
  const removeDpsUserRole = (context: Context, username: string, roleCode: string): Promise<UserRoleDetail> =>
    del(context, `/prisonusers/${username}/roles/${roleCode}`)

  return {
    addDpsUserRoles,
    addUserCaseloads,
    addUserGroup,
    amendUserEmail,
    assignableGroups,
    assignableRoles,
    changeChildGroupName,
    changeDpsEmail,
    changeGroupName,
    changeRoleAdminType,
    changeRoleDescription,
    changeRoleName,
    childGroupDetails,
    contextUserRoles,
    createChildGroup,
    createEmailDomain,
    createExternalUser,
    createGroup,
    createLinkedCentralAdminUser,
    createLinkedGeneralUser,
    createLinkedLsaUser,
    createRole,
    createUser,
    currentRoles,
    currentUser,
    currentUserCaseloads,
    deactivateExternalUser,
    deleteChildGroup,
    deleteEmailDomain,
    deleteExternalUserRole,
    deleteGroup,
    disableExternalUser,
    disablePrisonUser,
    enableExternalUser,
    enablePrisonUser,
    externalUserAddRoles,
    externalUserRoles,
    getAllEmailDomains,
    getCaseloads,
    getDpsUser,
    getNotificationBannerMessage,
    getPagedRoles,
    getRoleDetails,
    getRoles,
    getUser,
    getUserCaseloads,
    getUserEmail,
    groupDetails,
    removeDpsUserRole,
    removeUserCaseload,
    removeUserGroup,
    searchableRoles,
    syncDpsEmail,
    userGroups,
    userSearch,
  }
}

export type ManageUsersApi = ReturnType<typeof manageUsersApiFactory>
