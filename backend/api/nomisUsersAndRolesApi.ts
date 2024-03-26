import querystring from 'querystring'
import { OAuthEnabledClient } from './oauthEnabledClient'
import { Context } from '../interfaces/context'
import { PagedList } from '../interfaces/pagedList'
import {
  NomisCreateRoleRequest,
  NomisGroupAdminSummaryWithEmail,
  NomisPrisonCaseload,
  NomisRoleDetail,
  NomisUpdateRoleRequest,
  NomisUserCaseloadDetail,
  NomisUserDetail,
  NomisUserSummaryWithEmail,
} from '../@types/nomisUserRolesApi'

export interface UserSearchParams {
  nameFilter?: string
  accessRoles?: string[]
  status?: string
  caseload?: string
  activeCaseload?: string
  inclusiveRoles?: boolean
  showOnlyLSAs?: boolean
}

export interface PagedUserSearchParams extends UserSearchParams {
  page?: number
  size?: number
}

export const nomisUsersAndRolesFactory = (oauthEnabledClient: OAuthEnabledClient) => {
  const get = (context: Context, path: string) =>
    oauthEnabledClient.get(context, path).then((response) => response.body)
  const post = (context: Context, path: string, body: unknown) =>
    oauthEnabledClient.post(context, path, body).then((response) => response.body)
  const put = (context: Context, path: string, body: unknown) =>
    oauthEnabledClient.put(context, path, body).then((response) => response.body)
  const del = (context: Context, path: string) =>
    oauthEnabledClient.del(context, path).then((response) => response.body)

  interface Username {
    username: string
  }

  const userSearch = (
    context: Context,
    {
      nameFilter,
      accessRoles,
      status,
      caseload,
      size = 20,
      page = 0,
      activeCaseload,
      inclusiveRoles,
      showOnlyLSAs,
    }: PagedUserSearchParams,
  ): Promise<PagedList<NomisUserSummaryWithEmail>> =>
    get(
      context,
      `/users?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        size,
        page,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const downloadUserSearch = (
    context: Context,
    { nameFilter, accessRoles, status, caseload, activeCaseload, inclusiveRoles, showOnlyLSAs }: UserSearchParams,
  ): Promise<NomisUserSummaryWithEmail[]> =>
    get(
      context,
      `/users/download?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const downloadLsaSearch = (
    context: Context,
    { nameFilter, accessRoles, status, caseload, activeCaseload, inclusiveRoles, showOnlyLSAs }: UserSearchParams,
  ): Promise<NomisGroupAdminSummaryWithEmail[]> =>
    get(
      context,
      `/users/download/admins?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const getRoles = (context: Context, hasAdminRole: string): Promise<NomisRoleDetail[]> =>
    get(context, `/roles?admin-roles=${hasAdminRole}`)
  const getCaseloads = (context: Context): Promise<NomisPrisonCaseload[]> => get(context, '/reference-data/caseloads')

  const currentUserCaseloads = (context: Context, username: string): Promise<NomisUserCaseloadDetail> | [] =>
    context.authSource !== 'auth' ? getUserCaseloads(context, username) : []

  const getUser = (context: Context, username: string): Promise<NomisUserDetail> => get(context, `/users/${username}`)
  const enableUser = (context: Context, { username }: Username): Promise<Response> =>
    put(context, `/users/${username}/unlock-user`, {})
  const disableUser = (context: Context, { username }: Username): Promise<Response> =>
    put(context, `/users/${username}/lock-user`, {})
  const addUserRole = (
    context: Context,
    username: string,
    roleCode: string,
    request: NomisUpdateRoleRequest,
  ): Promise<NomisRoleDetail> => put(context, `/users/${username}/roles/${roleCode}`, request)
  const addUserRoles = (
    context: Context,
    username: string,
    request: NomisCreateRoleRequest,
  ): Promise<NomisRoleDetail> => post(context, `/users/${username}/roles`, request)
  const removeUserRole = (context: Context, username: string, roleCode: string): Promise<Response> =>
    del(context, `/users/${username}/roles/${roleCode}`)
  const addUserCaseloads = (
    context: Context,
    username: string,
    caseloads: string[],
  ): Promise<NomisUserCaseloadDetail> => post(context, `/users/${username}/caseloads`, caseloads)
  const getUserCaseloads = (context: Context, username: string): Promise<NomisUserCaseloadDetail> =>
    get(context, `/users/${username}/caseloads`)
  const removeUserCaseload = (
    context: Context,
    username: string,
    caseloadId: string,
  ): Promise<NomisUserCaseloadDetail> => del(context, `/users/${username}/caseloads/${caseloadId}`)

  return {
    userSearch,
    downloadUserSearch,
    downloadLsaSearch,
    getRoles,
    getCaseloads,
    currentUserCaseloads,
    getUser,
    enableUser,
    disableUser,
    addUserRole,
    addUserRoles,
    removeUserRole,
    getUserCaseloads,
    addUserCaseloads,
    removeUserCaseload,
  }
}
