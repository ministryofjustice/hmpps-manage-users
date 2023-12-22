import { OAuthEnabledClient } from './oauthEnabledClient'
import { Context } from '../interfaces/context'
import superagent from 'superagent'
import { AdminType, Role } from '../interfaces/role'
import { Group } from '../interfaces/group'

const querystring = require('querystring')
const contextProperties = require('../contextProperties')

const processPageResponse = (context: Context) => (response: superagent.Response) => {
  if (response.body.pageable) {
    contextProperties.setPageable(context, response.body)
    return response.body.content
  }
  return response.body
}
interface ManageUsersApi {
  getNotificationBannerMessage: (context: Context, notificationType: string) => Promise<any>;
  searchUserByUserName: (context: Context, username: string) => Promise<any>;
  currentUser: (context: Context) => Promise<any>;
  contextUserRoles: (context: Context, username: string) => Promise<any>;
  createUser: (context: Context, user: any) => Promise<any>;
  createLinkedCentralAdminUser: (context: Context, user: any) => Promise<any>;
  createLinkedLsaUser: (context: Context, user: any) => Promise<any>;
  createLinkedGeneralUser: (context: Context, user: any) => Promise<any>;
  getUser: (context: Context, userId: { userId: string }) => Promise<any>;
  getUserEmail: (context: Context, username: { username: string }) => Promise<any>;
  amendUserEmail: (context: Context, userId: string, email: string) => Promise<any>;
  createRole: (context: Context, role: Role) => Promise<any>;
  getPagedRoles: (context: Context, page: number, size: number, roleName: string, roleCode: string, adminType: string) => Promise<any>;
  getAllEmailDomains: (context: Context) => Promise<any>;
  createEmailDomain: (context: Context, domain: string) => Promise<any>;
  deleteEmailDomain: (context: Context, domainId: string) => Promise<any>;
  getRoles: (context: Context, adminTypes: { adminTypes: string }) => Promise<any>;
  assignableRoles: (context: Context, userId: { userId: string }) => Promise<any>;
  getRoleDetails: (context: Context, roleCode: string) => Promise<any>;
  changeRoleName: (context: Context, roleCode: string, roleName: string) => Promise<any>;
  changeRoleDescription: (context: Context, role: string, roleDescription: string) => Promise<any>;
  changeRoleAdminType: (context: Context, role: string, adminType: string) => Promise<any>;
  createGroup: (context: Context, group: Group) => Promise<any>;
  groupDetails: (context: Context, group: { group: string }) => Promise<any>;
  changeGroupName: (context: Context, group: string, groupName: string) => Promise<any>;
  deleteGroup: (context: Context, group: string) => Promise<any>;
  createChildGroup: (context: Context, group: Group) => Promise<any>;
  childGroupDetails: (context: Context, group: { group: string }) => Promise<any>;
  changeChildGroupName: (context: Context, group: string, groupName: string) => Promise<any>;
  deleteChildGroup: (context: Context, group: string) => Promise<any>;
  assignableGroups: (context: Context) => Promise<any>;
  userGroups: (context: Context, userId: { userId: string }) => Promise<any>;
  addUserGroup: (context: Context, userId: { userId: string }, group: { group: string }) => Promise<any>;
  removeUserGroup: (context: Context, userId: { userId: string }, group: { group: string }) => Promise<any>;
  userSearch: (context: Context, {nameFilter, role, group, status}: {nameFilter: string, role: string, group: string, status: string}, page: number, size: number) => Promise<any>;
  enableExternalUser: (context: Context, userId: { userId: string }) => Promise<any>;
  disableExternalUser: (context: Context, userId: { userId: string }) => Promise<any>;
  deactivateExternalUser: (context: Context, userId: { userId: string }, reason: string) => Promise<any>;
  currentRoles: (context: Context) => Promise<any>;
  searchableRoles: (context: Context) => Promise<any>;
  changeDpsEmail: (context: Context, username: string, email: string) => Promise<any>;
  syncDpsEmail: (context: Context, username: string) => Promise<any>;
  createExternalUser: (context: Context, user: any) => Promise<any>;
  externalUserRoles: (context: Context, userId: string) => Promise<superagent.Response>
  externalUserAddRoles: (context: Context, { userId, roles }: { userId: string; roles: string[] }) => Promise<superagent.Response>
  deleteExternalUserRole: (context: Context, { userId, role }: { userId: string; role: string }) => Promise<superagent.Response>
}

const manageUsersApiFactory = (client: OAuthEnabledClient): ManageUsersApi => {
  const get = (context: Context, path: string): Promise<superagent.Response> =>
    client.get(context, path).then((response) => response.body)
  const post = (context: Context, path: string, body?: string | object): Promise<superagent.Response> =>
    client.post(context, path, body).then((response) => response.body)
  const put = (context: Context, path: string, body?: string | object): Promise<superagent.Response> =>
    client.put(context, path, body).then((response) => response.body)
  const del = (context: Context, path: string): Promise<superagent.Response> =>
    client.del(context, path).then((response) => response.body)

  const getNotificationBannerMessage = (context: Context, notificationType: string) =>
    get(context, `/notification/banner/${notificationType}`)

  const createRole = (context: Context, role: Role): Promise<superagent.Response>  => post(context, '/roles', role)
  const getRoles = (context: Context, { adminTypes }: { adminTypes: string }): Promise<superagent.Response> =>
    get(context, `/roles?adminTypes=${adminTypes}`)
  const getPagedRoles = (
    context: Context,
    page: number,
    size: number,
    roleName: string,
    roleCode: string,
    adminType: string,
  ): Promise<any> => {
    const adminTypes = adminType === 'ALL' ? '' : adminType
    const query = querystring.stringify({
      page,
      size,
      roleName,
      roleCode,
      adminTypes,
    })
    return client.get(context, `/roles/paged?${query}`).then(processPageResponse(context))
  }
  const getRoleDetails = (context: Context, roleCode: string): Promise<superagent.Response>  => get(context, `/roles/${roleCode}`)
  const changeRoleName = (context: Context, roleCode: string, roleName: string): Promise<superagent.Response>  =>
    client.put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (context: Context, role: string, roleDescription: string): Promise<superagent.Response>  =>
    put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (context: Context, role: string, adminType: string): Promise<superagent.Response>  =>
    put(context, `/roles/${role}/admintype`, adminType)

  const createGroup = (context: Context, group: Group): Promise<superagent.Response>  => post(context, '/groups', group)
  const createExternalUser = (context: Context, user: ExternalUser): Promise<superagent.Response>  => post(context, `/externalusers/create`, user)
  const groupDetails = (context: Context, { group }: { group: string }): Promise<superagent.Response>  => get(context, `/groups/${group}`)
  const changeGroupName = (context: Context, group: string, groupName: string): Promise<superagent.Response>  =>
    put(context, `/groups/${group}`, groupName)
  const deleteGroup = (context: Context, group: string): Promise<superagent.Response>  => del(context, `/groups/${group}`)

  const createChildGroup = (context: Context, group: Group): Promise<superagent.Response>  => post(context, '/groups/child', group)
  const childGroupDetails = (context: Context, { group }: { group: string }): Promise<superagent.Response>  => get(context, `/groups/child/${group}`)
  const changeChildGroupName = (context: Context, group: string, groupName: string): Promise<superagent.Response>  =>
    put(context, `/groups/child/${group}`, groupName)
  const deleteChildGroup = (context: Context, group: string): Promise<superagent.Response>  => del(context, `/groups/child/${group}`)

  const getAllEmailDomains = (context: Context): Promise<superagent.Response>  => {
    return client.get(context, `/email-domains`).then(processPageResponse(context))
  }
  const createEmailDomain = (context: Context, domain: string): Promise<superagent.Response>  => post(context, '/email-domains', domain)
  const deleteEmailDomain = (context: Context, domainId: string): Promise<superagent.Response>  => del(context, `/email-domains/${domainId}`)

  const currentUser = (context: Context): Promise<superagent.Response>  => get(context, '/users/me')
  const currentRoles = (context: Context): Promise<superagent.Response>  => get(context, '/users/me/roles')
  const getUserEmail = async (context: Context, { username }: { username: string }): Promise<superagent.Response | {}> => {
    try {
      return await get(context, `/users/${username}/email?unverified=true`)
    } catch (error) {
      if (error?.status === 404) return {}
      throw error
    }
  }

  const externalUserAddRoles = (context: Context, { userId, roles }: { userId: string; roles: string[] }): Promise<superagent.Response>  =>
    post(context, `/externalusers/${userId}/roles`, roles)
  const externalUserRoles = (context: Context, userId: string): Promise<superagent.Response>  => get(context, `/externalusers/${userId}/roles`)
  const deleteExternalUserRole = (context: Context, { userId, role }: { userId: string; role: string }): Promise<superagent.Response>  =>
    del(context, `/externalusers/${userId}/roles/${role}`)
  const assignableRoles = (context: Context, { userId }: { userId: string }): Promise<superagent.Response>  =>
    get(context, `/externalusers/${userId}/assignable-roles`)
  const searchableRoles = (context: Context): Promise<superagent.Response>  => get(context, '/externalusers/me/searchable-roles')
  const assignableGroups = (context: Context): Promise<superagent.Response>  => get(context, '/externalusers/me/assignable-groups')
  const userGroups = (context: Context, { userId }: { userId: string }): Promise<superagent.Response>  =>
    get(context, `/externalusers/${userId}/groups?children=false`)
  const removeUserGroup = (context: Context, { userId, group }: { userId: string; group: string }): Promise<superagent.Response>  =>
    del(context, `/externalusers/${userId}/groups/${group}`)
  const addUserGroup = (context: Context, { userId, group }: { userId: string; group: string }): Promise<superagent.Response>  =>
    put(context, `/externalusers/${userId}/groups/${group}`)
  const getUser = (context: Context, { userId }: { userId: string }): Promise<superagent.Response>  => get(context, `/externalusers/id/${userId}`)
  const amendUserEmail = (context: Context, userId: string, email: string): Promise<superagent.Response>  =>
    post(context, `/externalusers/${userId}/email`, email)

  const userSearch = (
    context: Context,
    { nameFilter, role, group, status }: { nameFilter: string; role: string; group: string; status: string },
    page: number,
    size: number,
  ): Promise<superagent.Response> => {
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
    return client.get(context, `/externalusers/search?${query}`).then(processPageResponse(context))
  }
  const enableExternalUser = (context: Context, { userId }: { userId: string }): Promise<superagent.Response> =>
    put(context, `/externalusers/${userId}/enable`)
  const disableExternalUser = (context: Context, { userId }: { userId: string }): Promise<superagent.Response>  =>
    put(context, `/externalusers/${userId}/disable`)
  const deactivateExternalUser = (context: Context, { userId, reason }: { userId: string; reason: string }): Promise<superagent.Response>  =>
    put(context, `/externalusers/${userId}/disable`, { reason })

  const searchUserByUserName = (context: Context, username: string): Promise<superagent.Response>  => get(context, `/prisonusers/${username}`)
  const createUser = (context: Context, user: PrisonUser): Promise<superagent.Response>  => post(context, '/prisonusers', user)
  const createLinkedCentralAdminUser = (context: Context, user: LinkedLsaUser): Promise<superagent.Response>  =>
    post(context, '/linkedprisonusers/admin', user)
  const createLinkedLsaUser = (context: Context, user: LinkedLsaUser): Promise<superagent.Response>  => post(context, '/linkedprisonusers/lsa', user)
  const createLinkedGeneralUser = (context: Context, user: LinkedLsaUser): Promise<superagent.Response>  =>
    post(context, '/linkedprisonusers/general', user)
  const changeDpsEmail = (context: Context, username: string, email: string): Promise<superagent.Response>  =>
    post(context, `/prisonusers/${username}/email`, email)
  const syncDpsEmail = (context: Context, username: string): Promise<superagent.Response>  => post(context, `/prisonusers/${username}/email/sync`)
  const contextUserRoles = (context: Context, username: string): Promise<superagent.Response>  => get(context, `/prisonusers/${username}/roles`)

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
