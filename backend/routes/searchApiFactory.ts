import { RequestContext } from '../api/axios-config-decorators'
import { PrisonApi, Role, User } from '../api/prisonApi'
import contextProperties from '../contextProperties'

interface LoogedInUser {
  maintainAccessAdmin?: boolean
}
interface UserContext extends RequestContext {
  user?: LoogedInUser
}

interface SearchApi {
  locals: UserContext
  user?: string
  roleCode?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  groupCode?: string
  activeCaseload?: string
  pageSize: number
  pageOffset: number
}

interface OauthApi {
  userEmails: (context: UserContext, usernames: string[]) => Promise<AuthUserEmail[]>
}
interface AuthUserEmail {
  username: string
  email: string
}

interface UserWithEmail extends User {
  email?: string
}

interface Option {
  value: string
  text: string
}

interface SearchApiComponents {
  searchApi: (params: SearchApi) => Promise<UserWithEmail[]>
  searchableRoles: (context: UserContext) => Promise<Role[]>
  caseloads: (context: UserContext) => Promise<Option[]>
}

function searchApiFactory(prisonApi: PrisonApi, oauthApi: OauthApi): SearchApiComponents {
  const searchApi = async ({
    locals: context,
    user: nameFilter,
    roleCode,
    status,
    groupCode,
    activeCaseload,
    pageSize: size,
    pageOffset: offset,
  }: SearchApi) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)

    contextProperties.setRequestPagination(context, { offset, size })
    const searchResults = await (hasAdminRole
      ? prisonApi.userSearchAdmin(context, {
          nameFilter,
          roleFilter: roleCode,
          status,
          caseload: groupCode,
          activeCaseload,
        })
      : prisonApi.userSearch(context, { nameFilter, roleFilter: roleCode, status }))

    if (searchResults.length === 0) return searchResults

    // now augment with auth email addresses
    const emails = await oauthApi.userEmails(
      context,
      searchResults.map((user) => user.username),
    )
    const emailMap = new Map(emails.map((obj) => [obj.username, obj.email]))

    return searchResults.map((user) => ({ ...user, email: emailMap.get(user.username) }))
  }

  const searchableRoles = (context: UserContext) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    return hasAdminRole ? prisonApi.getRolesAdmin(context) : prisonApi.getRoles(context)
  }

  const caseloads = async (context: UserContext) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await prisonApi.getCaseloads(context))
      .map((g) => ({
        text: g.description,
        value: g.agencyId,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  return {
    searchApi,
    searchableRoles,
    caseloads,
  }
}
const factory = (prisonApi: PrisonApi, oauthApi: OauthApi): SearchApiComponents => searchApiFactory(prisonApi, oauthApi)

export default factory
