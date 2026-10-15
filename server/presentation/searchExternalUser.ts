import { UserGroup, UserRole } from 'manageUsersApiClient'
import { hasRole, HmppsUser } from '../interfaces/hmppsUser'
import AuthRole from '../interfaces/authRole'
import Category from '../interfaces/filter'
import paths from '../routes/paths'
import { statusDisplay, StatusKey } from './status'
import SearchParamsHelper from './searchParams'

export interface Filter {
  user?: string
  status?: string
  roleCode?: string
  groupCode?: string
}

export const asUrlSearchParams = (filter: Filter): URLSearchParams => {
  const stringify: [string, string][] = Object.entries(filter)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)])
  return new URLSearchParams(stringify)
}

const searchParamsHelper = new SearchParamsHelper(paths.externalUser.search.pattern)

const hrefToRemoveFilter = (searchParams: URLSearchParams, fieldName: string): string => {
  return searchParamsHelper.hrefToRemoveFilter(searchParams, fieldName)
}

const getUserCategory = (searchParams: URLSearchParams, user: string) => ({
  heading: { text: 'User' },
  items: [{ href: hrefToRemoveFilter(searchParams, 'user'), text: user }],
})

const getStatusCategory = (searchParams: URLSearchParams, status: StatusKey) => ({
  heading: { text: 'Status' },
  items: [{ href: hrefToRemoveFilter(searchParams, 'status'), text: statusDisplay(status) }],
})

const getGroupCategory = (searchParams: URLSearchParams, groups: UserGroup[], groupCode: string) => ({
  heading: { text: 'Group' },
  items: [
    {
      href: hrefToRemoveFilter(searchParams, 'groupCode'),
      text: groups.find(g => g.groupCode === groupCode)?.groupName ?? groupCode,
    },
  ],
})

const getRoleCategory = (searchParams: URLSearchParams, roles: UserRole[], roleCode: string) => ({
  heading: { text: 'Role' },
  items: [
    {
      href: hrefToRemoveFilter(searchParams, 'roleCode'),
      text: roles.find(r => r.roleCode === roleCode)?.roleName ?? roleCode,
    },
  ],
})

export const filterCategories = (filter: Filter, roles: UserRole[], groups: UserGroup[]): Category[] => {
  const categories: Category[] = []
  const searchParams = asUrlSearchParams(filter)
  if (filter.user) {
    categories.push(getUserCategory(searchParams, filter.user))
  }
  if (filter.status && filter.status !== 'ALL') {
    categories.push(getStatusCategory(searchParams, filter.status as StatusKey))
  }
  if (filter.groupCode) {
    categories.push(getGroupCategory(searchParams, groups, filter.groupCode))
  }
  if (filter.roleCode) {
    categories.push(getRoleCategory(searchParams, roles, filter.roleCode))
  }
  return categories
}

export const canDownload = (user: HmppsUser): boolean =>
  hasRole(user, AuthRole.MAINTAIN_OAUTH_USERS) && !hasRole(user, AuthRole.AUTH_GROUP_MANAGER)
