import querystring from 'querystring'
import config from '../config'
import contextProperties from '../contextProperties'
import { RequestContext } from './axios-config-decorators'

import { Client } from './oauthEnabledClient'

const encodeQueryString = (input: string) => encodeURIComponent(input)

export interface UserSearchAdminFilter {
  nameFilter?: string
  roleFilter?: string
  status?: string
  caseload?: string
  activeCaseload?: string
}
export interface UserSearchFilter {
  nameFilter?: string
  roleFilter?: string
  status?: string
}

export interface Role {
  roleCode: string
  roelName: string
}

export interface User {
  username: string
  activeCaseLoadId: string
}

export interface Caseload {
  description: string
  agencyId: string
}

const prisonApiFactory = (client: Client) => {
  const processResponse = (context: RequestContext) => (response: { headers: unknown; body: unknown }) => {
    contextProperties.setResponsePagination(context, response.headers)
    return response.body
  }

  const get = (context: RequestContext, url: string, resultsLimit: number | undefined = undefined) =>
    client.get(context, url, resultsLimit).then(processResponse(context))
  const post = (context: RequestContext, url: string, data: string) =>
    client.post(context, url, data).then(processResponse(context))
  const put = (context: RequestContext, url: string, data: string | undefined = undefined) =>
    client.put(context, url, data).then(processResponse(context))
  const del = (context: RequestContext, url: string, data: string | undefined = undefined) =>
    client.del(context, url, data).then(processResponse(context))

  const userCaseLoads = (context: RequestContext) =>
    context.authSource !== 'auth' ? get(context, '/api/users/me/caseLoads') : []
  const getAgencyDetails = (context: RequestContext, caseloadId: unknown) =>
    get(context, `/api/agencies/caseload/${caseloadId}`)
  const userSearch = (context: RequestContext, { nameFilter, roleFilter, status }: UserSearchFilter): Promise<User[]> =>
    get(
      context,
      `/api/users/local-administrator/available?nameFilter=${encodeQueryString(
        nameFilter ?? '',
      )}&accessRole=${roleFilter}&status=${status}`,
    ) as Promise<User[]>
  const userSearchAdmin = (
    context: RequestContext,
    { nameFilter, roleFilter, status, caseload, activeCaseload }: UserSearchAdminFilter,
  ): Promise<User[]> =>
    get(
      context,
      `/api/users?${querystring.stringify({ nameFilter, accessRole: roleFilter, status, caseload, activeCaseload })}`,
    ) as Promise<User[]>
  const getRoles = (context: RequestContext) => get(context, '/api/access-roles') as Promise<Role[]>
  const getRolesAdmin = (context: RequestContext): Promise<Role[]> =>
    get(context, '/api/access-roles?includeAdmin=true') as Promise<Role[]>
  const contextUserRoles = (context: RequestContext, username: string, hasAdminRole: boolean) =>
    get(
      context,
      `/api/users/${username}/access-roles/caseload/${config.app.applicationCaseload}?includeAdmin=${hasAdminRole}`,
    ) as Promise<Role[]>
  const removeRole = (context: RequestContext, username: string, roleCode: string) =>
    del(context, `/api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const addRole = (context: RequestContext, username: string, roleCode: string) =>
    put(context, `/api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const getUser = (context: RequestContext, username: string) => get(context, `/api/users/${username}`)
  const addUserRoles = (context: RequestContext, username: string, roles: string) =>
    post(context, `/api/users/${username}/access-role`, roles)
  const assignableRoles = async (context: RequestContext, username: string, hasAdminRole: boolean) => {
    const [userRoles, allRoles] = await Promise.all<Role[], Role[]>([
      contextUserRoles(context, username, hasAdminRole),
      hasAdminRole ? getRolesAdmin(context) : getRoles(context),
    ])
    return allRoles.filter((r) => !userRoles.some((userRole) => userRole.roleCode === r.roleCode))
  }
  const getCaseloads = (context: RequestContext): Promise<Caseload[]> =>
    get(context, '/api/agencies/type/INST?activeOnly=true&withAddresses=false&skipFormatLocation=false') as Promise<
      Caseload[]
    >

  return {
    userSearch,
    getRoles,
    getRolesAdmin,
    contextUserRoles,
    removeRole,
    addRole,
    addUserRoles,
    getUser,
    userSearchAdmin,
    getAgencyDetails,
    userCaseLoads,
    assignableRoles,
    getCaseloads,
  }
}

export type PrisonApiFactory = typeof prisonApiFactory
export type PrisonApi = ReturnType<PrisonApiFactory>

module.exports = { prisonApiFactory }
