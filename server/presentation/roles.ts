import { Role, UserRole } from 'manageUsersApiClient'
import { SelectItem, SelectItemWithHint } from '../interfaces/selectItem'
import SearchParamsHelper from './searchParams'
import paths from '../routes/paths'
import Category from '../interfaces/filter'

export const roleDropdownValues = (roles: Role[]): SelectItem[] =>
  roles.map(role => ({
    text: role.roleName,
    value: role.roleCode,
  }))

export const roleDropdownValuesWithHint = (roles: UserRole[]): SelectItemWithHint[] =>
  roles.map((r: UserRole) => ({
    text: r.roleName,
    value: r.roleCode,
    ...(r.roleDescription && {
      hint: {
        text: r.roleDescription,
      },
    }),
  }))

export const enum AdminType {
  EXT_ADM = 'External Administrators',
  DPS_LSA = 'DPS Local System Administrators (LSA)',
  DPS_ADM = 'DPS Central Admin',
}

export type AdminTypeKey = keyof typeof AdminType

const adminTypeMap = new Map<AdminTypeKey, AdminType>([
  ['EXT_ADM', AdminType.EXT_ADM],
  ['DPS_LSA', AdminType.DPS_LSA],
  ['DPS_ADM', AdminType.DPS_ADM],
])

const adminTypeShorthandMap = new Map<AdminTypeKey, string>([
  ['EXT_ADM', 'EXT ADMIN'],
  ['DPS_LSA', 'DPS LSA'],
  ['DPS_ADM', 'DPS ADMIN'],
])

const adminTypeImmutableMap = new Map<AdminTypeKey, boolean>([
  ['EXT_ADM', true],
  ['DPS_LSA', false],
  ['DPS_ADM', true],
])

export const adminTypeItems = (): SelectItem[] => Array.from(adminTypeMap, ([k, v]) => ({ value: k, text: v }))

export const adminTypeItemsDisablingImmutable = (currentSelected: string[]): SelectItem[] =>
  Array.from(adminTypeMap, ([k, v]) => ({
    value: k,
    text: v,
    disabled: currentSelected.includes(k) && adminTypeImmutableMap.get(k) === true,
  }))

export const adminTypeShorthand = (adminType: AdminTypeKey): string => adminTypeShorthandMap.get(adminType) as string

export interface Filter {
  roleName?: string
  roleCode?: string
  adminType?: string
}

const searchParamsHelper = new SearchParamsHelper(paths.roles.list.pattern)

const hrefToRemoveFilter = (searchParams: URLSearchParams, fieldName: string, fieldValue?: string): string => {
  return searchParamsHelper.hrefToRemoveFilter(searchParams, fieldName, fieldValue)
}

export const asUrlSearchParams = (filter: Filter): URLSearchParams => {
  const stringify: [string, string][] = Object.entries(filter)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => [k, String(v)])
  return new URLSearchParams(stringify)
}

export const filterCategories = (filter: Filter): Category[] => {
  const categories: Category[] = []
  const searchParams = asUrlSearchParams(filter)
  if (filter.roleName) {
    categories.push(getRoleNameCategory(searchParams, filter))
  }
  if (filter.roleCode) {
    categories.push(getRoleCodeCategory(searchParams, filter))
  }
  if (filter.adminType && filter.adminType !== 'ALL') {
    categories.push(getAdminTypeCategory(searchParams, filter))
  }
  return categories
}

const getRoleNameCategory = (searchParams: URLSearchParams, filter: Filter) => {
  return {
    heading: {
      text: 'Role name',
    },
    items: [
      {
        href: hrefToRemoveFilter(searchParams, 'roleName'),
        text: filter.roleName as string,
      },
    ],
  }
}

const getRoleCodeCategory = (searchParams: URLSearchParams, filter: Filter) => {
  return {
    heading: {
      text: 'Role code',
    },
    items: [
      {
        href: hrefToRemoveFilter(searchParams, 'roleCode'),
        text: filter.roleCode as string,
      },
    ],
  }
}

const getAdminTypeCategory = (searchParams: URLSearchParams, filter: Filter) => {
  return {
    heading: {
      text: 'Role administrator',
    },
    items: [
      {
        href: hrefToRemoveFilter(searchParams, 'adminType'),
        text: adminTypeShorthand(filter.adminType as AdminTypeKey),
      },
    ],
  }
}
