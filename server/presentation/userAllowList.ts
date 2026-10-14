import { UserAllowlistDetail } from 'manageUsersApiClient'
import moment from 'moment'
import { hasRole, HmppsUser } from '../interfaces/hmppsUser'
import AuthRole from '../interfaces/authRole'
import Category from '../interfaces/filter'
import paths from '../routes/paths'
import SearchParamsHelper from './searchParams'
import { statusDisplay, StatusKey } from './status'

export interface Filter {
  user?: string
  status?: string
  userType?: string
}

export const asUrlSearchParams = (filter: Filter): URLSearchParams => {
  const stringify: [string, string][] = Object.entries(filter)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)])
  return new URLSearchParams(stringify)
}

const searchParamsHelper = new SearchParamsHelper(paths.userAllowList.search.pattern)

const getUserCategory = (searchParams: URLSearchParams, filter: Filter) => ({
  heading: { text: 'User' },
  items: [{ href: hrefToRemoveFilter(searchParams, 'user'), text: filter.user as string }],
})

const getStatusCategory = (searchParams: URLSearchParams, filter: Filter) => ({
  heading: { text: 'Status' },
  items: [{ href: hrefToRemoveFilter(searchParams, 'status'), text: statusDisplay(filter.status as StatusKey) }],
})

export const userTypeDisplay = (userType: UserAllowlistUserType): string =>
  userType === 'DIGITAL' ? 'Digital user' : 'General user'

const getUserTypeCategory = (searchParams: URLSearchParams, filter: Filter) => ({
  heading: { text: 'User type' },
  items: [
    {
      href: hrefToRemoveFilter(searchParams, 'userType'),
      text: userTypeDisplay(filter.userType as UserAllowlistUserType),
    },
  ],
})

export const filterCategories = (filter: Filter): Category[] => {
  const categories: Category[] = []
  const searchParams = asUrlSearchParams(filter)

  if (filter.user) {
    categories.push(getUserCategory(searchParams, filter))
  }
  if (filter.status && filter.status !== 'ALL') {
    categories.push(getStatusCategory(searchParams, filter))
  }
  if (filter.userType && filter.userType !== 'ALL') {
    categories.push(getUserTypeCategory(searchParams, filter))
  }
  return categories
}

const hrefToRemoveFilter = (searchParams: URLSearchParams, fieldName: string): string => {
  return searchParamsHelper.hrefToRemoveFilter(searchParams, fieldName)
}

export const canDownload = (user: HmppsUser): boolean => hasRole(user, AuthRole.MANAGE_USER_ALLOW_LIST)

export const getAllowlistStatus = (user: UserAllowlistDetail): string => {
  const today = new Date().toISOString().split('T')[0]
  return moment(today).isAfter(user.allowlistEndDate) ? 'EXPIRED' : 'ACTIVE'
}

export const displayUsers = (data: UserAllowlistDetail[]) => {
  return data.map((allowlistUser: UserAllowlistDetail) => ({
    ...allowlistUser,
    status: getAllowlistStatus(allowlistUser),
  }))
}

export type UserAllowlistUserType = 'DIGITAL' | 'GENERAL'
