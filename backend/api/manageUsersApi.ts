import { Context } from '../interfaces/context'
import { NotificationBanner } from '../interfaces/api/manageUsers/NotificationBanner'
import { PagedList } from '../interfaces/pagedList'
import {
  AdminTypePutRequest,
  Role,
  RoleDescriptionPutRequest,
  RoleNamePutRequest,
} from '../interfaces/api/manageUsers/Role'
import { OAuthEnabledClient } from './oauthEnabledClient'
import superagent from 'superagent'
import { ChildGroupPostRequest, GroupNamePutRequest, GroupPostRequest } from '../interfaces/api/manageUsers/Group'

const querystring = require('querystring')
const contextProperties = require('../contextProperties')

const processPageResponse =
  (context: Context): ((response: superagent.Response) => superagent.Response) =>
  (response: superagent.Response) => {
    if (response.body.pageable) {
      contextProperties.setPageable(context, response.body)
      return response.body.content
    }
    return response.body
  }

export interface manageUsersApi {
  getNotificationBannerMessage(context: Context, notificationType: string): NotificationBanner

  searchUserByUserName(context: Context, username: string): Promise<any>

  currentUser(context: Context): Promise<any>

  contextUserRoles(context: Context, username: string): Promise<any>

  createUser(context: Context, user: any): Promise<any>

  createLinkedCentralAdminUser(context: Context, user: any): Promise<any>

  createLinkedLsaUser(context: Context, user: any): Promise<any>

  createLinkedGeneralUser(context: Context, user: any): Promise<any>

  getUser(context: Context, userId: string): Promise<any>

  getUserEmail(context: Context, username: string): Promise<any>

  amendUserEmail(context: Context, userId: string, email: string): Promise<any>

  createRole(context: Context, role: any): Promise<any>

  getPagedRoles(
    context: Context,
    page: number,
    size: number,
    roleName: string,
    roleCode: string,
    adminType: string,
  ): Promise<PagedList<Role>>

  getAllEmailDomains(context: Context): Promise<any>

  createEmailDomain(context: Context, domain: any): Promise<any>

  deleteEmailDomain(context: Context, domainId: string): Promise<any>

  getRoles(context: Context, adminTypes: string): Promise<Role[]>

  assignableRoles(context: Context, userId: string): Promise<any>

  getRoleDetails(context: Context, roleCode: string): Promise<any>

  changeRoleName(context: Context, roleCode: string, roleName: string): Promise<any>

  changeRoleDescription(context: Context, role: string, roleDescription: string): Promise<any>

  changeRoleAdminType(context: Context, role: string, adminType: string): Promise<any>

  externalUserAddRoles(context: Context, userId: string, roles: any): Promise<any>

  externalUserRoles(context: Context, userId: string): Promise<any>

  deleteExternalUserRole(context: Context, userId: string, role: string): Promise<any>

  createGroup(context: Context, group: GroupPostRequest): Promise<any>

  groupDetails(context: Context, group: string): Promise<any>

  changeGroupName(context: Context, group: string, groupName: GroupNamePutRequest): Promise<any>

  deleteGroup(context: Context, group: string): Promise<any>

  createChildGroup(context: Context, group: any): Promise<any>

  childGroupDetails(context: Context, group: string): Promise<any>
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

  const getNotificationBannerMessage = (context: Context, notificationType: string): Promise<NotificationBanner> =>
    get(context, `/notification/banner/${notificationType}`)

  const createRole = (context: Context, role: string) => post(context, '/roles', role)
  const getRoles = (context: Context, { adminTypes }: { adminTypes: string }) =>
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
  const getRoleDetails = (context: Context, roleCode: string) => get(context, `/roles/${roleCode}`)
  const changeRoleName = (context: Context, roleCode: string, roleName: RoleNamePutRequest) =>
    put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (context: Context, role: string, roleDescription: RoleDescriptionPutRequest) =>
    put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (context: Context, role: string, adminType: AdminTypePutRequest) =>
    put(context, `/roles/${role}/admintype`, adminType)

  const createGroup = (context: Context, group: GroupPostRequest) => post(context, '/groups', group)
  const createExternalUser = (context: Context, user) => post(context, `/externalusers/create`, user)
  const groupDetails = (context: Context, { group }: { group: string }) => get(context, `/groups/${group}`)
  const changeGroupName = (context: Context, group: string, groupName: GroupNamePutRequest) =>
    put(context, `/groups/${group}`, groupName)
  const deleteGroup = (context: Context, group: string) => del(context, `/groups/${group}`)

  const createChildGroup = (context: Context, group: ChildGroupPostRequest) => post(context, '/groups/child', group)
  const childGroupDetails = (context: Context, { group }: { group: string }) => get(context, `/groups/child/${group}`)
  const changeChildGroupName = (context: Context, group: string, groupName: GroupNamePutRequest) =>
    put(context, `/groups/child/${group}`, groupName)
  const deleteChildGroup = (context: Context, group: string) => del(context, `/groups/child/${group}`)

  const getAllEmailDomains = (context: Context) => {
    return get(context, `/email-domains`).then(processPageResponse(context))
  }
  const createEmailDomain = (context: Context, domain) => post(context, '/email-domains', domain)
  const deleteEmailDomain = (context: Context, domainId) => del(context, `/email-domains/${domainId}`)

  const currentUser = (context: Context) => get(context, '/users/me')
  const currentRoles = (context: Context) => get(context, '/users/me/roles')
  const getUserEmail = async (context: Context, { username }) => {
    try {
      return await get(context, `/users/${username}/email?unverified=true`)
    } catch (error) {
      if (error?.status === 404) return {}
      throw error
    }
  }

  const externalUserAddRoles = (context: Context, { userId, roles }) =>
    post(context, `/externalusers/${userId}/roles`, roles)
  const externalUserRoles = (context: Context, userId) => get(context, `/externalusers/${userId}/roles`)
  const deleteExternalUserRole = (context: Context, { userId, role }) =>
    del(context, `/externalusers/${userId}/roles/${role}`)
  const assignableRoles = (context: Context, { userId }) => get(context, `/externalusers/${userId}/assignable-roles`)
  const searchableRoles = (context: Context) => get(context, '/externalusers/me/searchable-roles')

  const assignableGroups = (context: Context) => get(context, '/externalusers/me/assignable-groups')
  const userGroups = (context: Context, { userId }) => get(context, `/externalusers/${userId}/groups?children=false`)
  const removeUserGroup = (context: Context, { userId, group }) =>
    del(context, `/externalusers/${userId}/groups/${group}`)
  const addUserGroup = (context: Context, { userId, group }) => put(context, `/externalusers/${userId}/groups/${group}`)

  const getUser = (context: Context, { userId }) => get(context, `/externalusers/id/${userId}`)
  const amendUserEmail = (context: Context, userId, email) => post(context, `/externalusers/${userId}/email`, email)

  const userSearch = (context: Context, { nameFilter, role, group, status }, page, size) => {
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
    return get(context, `/externalusers/search?${query}`).then(processPageResponse(context))
  }
  const enableExternalUser = (context: Context, { userId }) => put(context, `/externalusers/${userId}/enable`)
  const disableExternalUser = (context: Context, { userId }) => put(context, `/externalusers/${userId}/disable`)
  const deactivateExternalUser = (context: Context, { userId, reason }) =>
    put(context, `/externalusers/${userId}/disable`, { reason })

  const searchUserByUserName = (context: Context, username) => get(context, `/prisonusers/${username}`)
  const createUser = (context: Context, user) => post(context, '/prisonusers', user)
  const createLinkedCentralAdminUser = (context: Context, user) => post(context, '/linkedprisonusers/admin', user)
  const createLinkedLsaUser = (context: Context, user) => post(context, '/linkedprisonusers/lsa', user)
  const createLinkedGeneralUser = (context: Context, user) => post(context, '/linkedprisonusers/general', user)
  const changeDpsEmail = (context: Context, username: string, email: string) =>
    post(context, `/prisonusers/${username}/email`, email)
  const syncDpsEmail = (context: Context, username: string) => post(context, `/prisonusers/${username}/email/sync`)
  const contextUserRoles = (context: Context, username: string) => get(context, `/prisonusers/${username}/roles`)

  return {
    getNotificationBannerMessage,
    searchUserByUserName,
    currentUser,
    contextUserRoles,
    createUser,
    createLinkedCentralAdminUser,
    createLinkedLsaUser,
    createLinkedGeneralUser,
    getUser,
    getUserEmail,
    amendUserEmail,
    createRole,
    getPagedRoles,
    getAllEmailDomains,
    createEmailDomain,
    deleteEmailDomain,
    getRoles,
    assignableRoles,
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
    changeRoleAdminType,
    externalUserAddRoles,
    externalUserRoles,
    deleteExternalUserRole,
    createGroup,
    groupDetails,
    changeGroupName,
    deleteGroup,
    createChildGroup,
    childGroupDetails,
    changeChildGroupName,
    deleteChildGroup,
    assignableGroups,
    userGroups,
    addUserGroup,
    removeUserGroup,
    userSearch,
    enableExternalUser,
    disableExternalUser,
    deactivateExternalUser,
    currentRoles,
    searchableRoles,
    changeDpsEmail,
    syncDpsEmail,
    createExternalUser,
  }
}

module.exports = { manageUsersApiFactory }
