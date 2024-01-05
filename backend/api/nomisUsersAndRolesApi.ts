import querystring from 'querystring'
import { OAuthEnabledClient } from './oauthEnabledClient'

interface UserSearchOptions {
  nameFilter?: string
  accessRoles?: string[]
  status?: string
  caseload?: string
  activeCaseload?: string
  size?: number
  page?: number
  inclusiveRoles?: string
  showOnlyLSAs?: string
}

interface User {
  username: string
}

export interface NomisUsersAndRolesApi {
  userSearch: (context: any, options: UserSearchOptions) => Promise<NomisUserSearchResponse>
  downloadUserSearch: (context: any, options: UserSearchOptions) => Promise<any>
  getRoles: (context: any, hasAdminRole: boolean) => Promise<any>
  getCaseloads: (context: any) => Promise<any>
  currentUserCaseloads: (context: any, username: string) => Promise<any[]>
  getUser: (context: any, username: string) => Promise<any>
  enableUser: (context: any, user: User) => Promise<any>
  disableUser: (context: any, user: User) => Promise<any>
  addUserRole: (context: any, username: string, roleCode: string) => Promise<any>
  addUserRoles: (context: any, username: string, roles: string[]) => Promise<any>
  removeUserRole: (context: any, username: string, roleCode: string) => Promise<any>
  addUserCaseloads: (context: any, username: string, caseloads: string[]) => Promise<any>
  getUserCaseloads: (context: any, username: string) => Promise<any>
  removeUserCaseload: (context: any, username: string, caseloadId: string) => Promise<any>
}

export const nomisUsersAndRolesFactory = (client: OAuthEnabledClient): NomisUsersAndRolesApi => {
  const get = (context: any, path: string) => client.get(context, path).then((response) => response.body)
  const post = (context: any, path: string, data: any) =>
    client.post(context, path, data).then((response) => response.body)
  const put = (context: any, path: string, data: any) =>
    client.put(context, path, data).then((response) => response.body)
  const del = (context: any, path: string) => client.del(context, path).then((response) => response.body)

  const userSearch = (
    context: any,
    {
      nameFilter = '',
      accessRoles = [],
      status = '',
      caseload = '',
      activeCaseload = '',
      size = 20,
      page = 0,
      inclusiveRoles = '',
      showOnlyLSAs = '',
    }: UserSearchOptions = {},
  ) =>
    get(
      context,
      `/users?${querystring.stringify({
        nameFilter,
        accessRoles: accessRoles.length > 0 ? accessRoles : '',
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
    context: any,
    {
      nameFilter = '',
      accessRoles = [],
      status = '',
      caseload = '',
      activeCaseload = '',
      size = 20,
      page = 0,
      inclusiveRoles = '',
      showOnlyLSAs = '',
    }: UserSearchOptions = {},
  ) =>
    get(
      context,
      `/users/download?${querystring.stringify({
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

  const getRoles = (context: any, hasAdminRole: boolean) => get(context, `/roles?admin-roles=${hasAdminRole}`)
  const getCaseloads = (context: any) => get(context, '/reference-data/caseloads')

  const currentUserCaseloads = (context: any, username: string): Promise<any[]> =>
    context.authSource !== 'auth' ? getUserCaseloads(context, username) : Promise.resolve([])

  const getUser = (context: any, username: string) => get(context, `/users/${username}`)
  const enableUser = (context: any, user: User) => put(context, `/users/${user.username}/unlock-user`, null)
  const disableUser = (context: any, user: User) => put(context, `/users/${user.username}/lock-user`, null)
  const addUserRole = (context: any, username: string, roleCode: string) =>
    put(context, `/users/${username}/roles/${roleCode}`, null)
  const addUserRoles = (context: any, username: string, roles: string[]) =>
    post(context, `/users/${username}/roles`, roles)
  const removeUserRole = (context: any, username: string, roleCode: string) =>
    del(context, `/users/${username}/roles/${roleCode}`)
  const addUserCaseloads = (context: any, username: string, caseloads: string[]) =>
    post(context, `/users/${username}/caseloads`, caseloads)
  const getUserCaseloads = (context: any, username: string) => get(context, `/users/${username}/caseloads`)
  const removeUserCaseload = (context: any, username: string, caseloadId: string) =>
    del(context, `/users/${username}/caseloads/${caseloadId}`)

  return {
    userSearch,
    downloadUserSearch,
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
