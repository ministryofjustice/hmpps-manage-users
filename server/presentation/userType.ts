import { SelectItem } from '../interfaces/selectItem'

export const enum UserType {
  DPS_ADM = 'Central Admin',
  DPS_GEN = 'General',
  DPS_LSA = 'Local System Administrator (LSA)',
}

export type UserTypeKey = keyof typeof UserType

const userTypeMap = new Map<UserTypeKey, UserType>([
  ['DPS_ADM', UserType.DPS_ADM],
  ['DPS_GEN', UserType.DPS_GEN],
  ['DPS_LSA', UserType.DPS_LSA],
])

const userTypeShorthandMap = new Map<UserTypeKey, string>([
  ['DPS_ADM', 'Admin'],
  ['DPS_GEN', 'General'],
  ['DPS_LSA', 'LSA'],
])

export const userTypeDisplay = (userType: UserTypeKey): string => userTypeMap.get(userType) as string

export const showCaseloadDropdown = (userType: UserTypeKey): boolean => userType !== 'DPS_ADM'

export const caseloadText = (userType: UserTypeKey): string =>
  `Select a default ${userType === 'DPS_LSA' ? 'local admin group' : 'caseload'}`

export const userTypeExistingUsernameLabel = (userType: UserTypeKey): string =>
  userType === 'DPS_GEN' ? 'Existing Admin Username' : 'Existing Username'

export const userTypeExistingUsernameHint = (userType: UserTypeKey): string =>
  `Search and populate existing ${userType === 'DPS_GEN' ? 'admin' : 'general'} user details by username`

export const userTypeShorthand = (userType: UserTypeKey): string => userTypeShorthandMap.get(userType) as string

export const userTypeItems = (): SelectItem[] => Array.from(userTypeMap, ([k, v]) => ({ value: k, text: v }))
