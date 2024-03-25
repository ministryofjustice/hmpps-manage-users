import { components } from './nomisUserRolesApiImport'

export type NomisErrorResponse = components['schemas']['ErrorResponse']
export type NomisPrisonCaseload = components['schemas']['PrisonCaseload']
export type NomisUserCaseloadDetail = components['schemas']['UserCaseloadDetail']
export type NomisStaffDetail = components['schemas']['StaffDetail']
export type NomisUpdateRoleRequest = components['schemas']['UpdateRoleRequest']
export type NomisRoleDetail = components['schemas']['RoleDetail']
export type NomisCaseloadRoleDetail = components['schemas']['CaseloadRoleDetail']
export type NomisUserRoleDetail = components['schemas']['UserRoleDetail']
export type NomisAuthentication = components['schemas']['Authentication']
export type NomisUserDetail = components['schemas']['UserDetail']
export type NomisRoleAssignmentsSpecification = components['schemas']['RoleAssignmentsSpecification']
export type NomisRoleAssignmentStats = components['schemas']['RoleAssignmentStats']
export type NomisCreateLocalAdminUserRequest = components['schemas']['CreateLocalAdminUserRequest']
export type NomisCreateLinkedGeneralUserRequest = components['schemas']['CreateLinkedGeneralUserRequest']
export type NomisCreateLinkedAdminUserRequest = components['schemas']['CreateLinkedAdminUserRequest']
export type NomisCreateGeneralUserRequest = components['schemas']['CreateGeneralUserRequest']
export type NomisCreateAdminUserRequest = components['schemas']['CreateAdminUserRequest']
export type NomisCreateRoleRequest = components['schemas']['CreateRoleRequest']
export type NomisPageable = components['schemas']['Pageable']
export type NomisPageUserSummaryWithEmail = components['schemas']['PageUserSummaryWithEmail']
export type NomisPageableObject = components['schemas']['PageableObject']
export type NomisSortObject = components['schemas']['SortObject']
export type NomisUserSummaryWithEmail = components['schemas']['UserSummaryWithEmail']
export type NomisUserAndEmail = components['schemas']['UserAndEmail']
export type NomisUserBasicDetails = components['schemas']['UserBasicDetails']

export type NomisUserGroupDetail = {
  /**
   * @description Group id
   * @example BXI
   */
  id: string
  /**
   * @description Group name
   * @example Brixton
   */
  name: string
}
export type NomisGroupAdminSummaryWithEmail = {
  /**
   * @description Username
   * @example testuser1
   */
  username: string
  /**
   * Format: int64
   * @description Staff ID
   * @example 324323
   */
  staffId: number
  /**
   * @description First name of the user
   * @example Mustafa
   */
  firstName: string
  /**
   * @description Last name of the user
   * @example Usmani
   */
  lastName: string
  /**
   * @description Account status indicator
   * @example true
   */
  active: boolean
  /**
   * @description Account status
   * @example OPEN
   * @enum {string}
   */
  status?:
    | 'OPEN'
    | 'EXPIRED'
    | 'EXPIRED_GRACE'
    | 'LOCKED_TIMED'
    | 'LOCKED'
    | 'EXPIRED_LOCKED_TIMED'
    | 'EXPIRED_GRACE_LOCKED_TIMED'
    | 'EXPIRED_LOCKED'
    | 'EXPIRED_GRACE_LOCKED'
  /**
   * @description Indicates that an account is locked.
   * @example false
   */
  locked: boolean
  /**
   * @description Indicates that an account is expired
   * @example false
   */
  expired: boolean
  activeCaseload?: components['schemas']['PrisonCaseload']
  /**
   * @description Primary email address of user - normally justice.gov.uk one if available otherwise first one in list
   * @example joe.bloggs@justice.gov.uk
   */
  email?: string
  groups?: Array<NomisUserGroupDetail>
  /**
   * @description Staff status
   * @example ACTIVE
   */
  staffStatus?: string
}
