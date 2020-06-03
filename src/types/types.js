import { arrayOf, bool, func, node, number, object, oneOfType, shape, string } from 'prop-types'

const caseLoadOptions = shape({
  caseLoadId: string.isRequired,
  caseloadFunction: string.isRequired,
  description: string.isRequired,
  type: string.isRequired,
})

export const userType = shape({
  activeCaseLoadId: string,
  caseLoadOptions: arrayOf(caseLoadOptions),
  expiredFlag: bool,
  firstName: string.isRequired,
  lastName: string.isRequired,
  lockedFlag: bool,
  maintainAccess: bool,
  maintainAccessAdmin: bool,
  migration: bool,
  staffId: number,
  username: string.isRequired,
  writeAccess: bool,
})

export const userListType = arrayOf(
  shape({
    expiredFlag: bool.isRequired,
    firstName: string.isRequired,
    lastName: string.isRequired,
    lockedFlag: bool.isRequired,
    staffId: number.isRequired,
    username: string.isRequired,
  })
)

export const contextUserType = shape({
  activeCaseLoadId: string.isRequired,
  agencyDescription: string.isRequired,
  expiredFlag: bool.isRequired,
  firstName: string.isRequired,
  lastName: string.isRequired,
  lockedFlag: bool.isRequired,
  staffId: number.isRequired,
  username: string.isRequired,
})

export const contextAuthUserType = shape({
  username: string,
  email: string,
  firstName: string,
  lastName: string,
  locked: bool,
  enabled: bool,
})

const authRoleType = shape({
  roleCode: string.isRequired,
  roleName: string.isRequired,
})

export const authRoleListType = arrayOf(authRoleType)
export const authUserListType = arrayOf(contextAuthUserType)

const authGroupType = shape({
  groupCode: string.isRequired,
  groupName: string.isRequired,
})

export const authGroupListType = arrayOf(authGroupType)

export const configType = shape({
  mailTo: string.isRequired,
  notmEndpointUrl: string.isRequired,
})

const roleType = shape({
  roleCode: string.isRequired,
  roleFunction: string.isRequired,
  roleId: number.isRequired,
  roleName: string.isRequired,
})

export const roleFilterListType = arrayOf(roleType)

export const roleListType = arrayOf(roleType)

const groupType = shape({
  groupCode: string.isRequired,
  groupFunction: string.isRequired,
  groupId: number.isRequired,
  groupName: string.isRequired,
})

export const groupFilterListType = arrayOf(groupType)

export const groupListType = arrayOf(groupType)

export const childrenType = oneOfType([arrayOf(node), node])

export const routeMatchType = shape({
  isExact: bool.isRequired,
  path: string.isRequired,
  url: string.isRequired,
})

export const formInputType = shape({
  name: string.isRequired,
  onBlur: func.isRequired,
  onChange: func.isRequired,
  onFocus: func.isRequired,
  value: oneOfType([string, object]).isRequired,
})

export const formMetaType = shape({
  active: bool,
  data: shape({}),
  dirty: bool.isRequired,
  dirtySinceLastSubmit: bool.isRequired,
  error: string,
  initial: string,
  invalid: bool.isRequired,
  pristine: bool.isRequired,
  submitError: string,
  submitFailed: bool.isRequired,
  submitSucceeded: bool.isRequired,
  submitting: bool.isRequired,
  touched: bool.isRequired,
  valid: bool.isRequired,
  visited: bool.isRequired,
})

export const errorType = oneOfType([
  string,
  arrayOf(
    shape({
      targetName: string,
      text: string,
    })
  ),
])
