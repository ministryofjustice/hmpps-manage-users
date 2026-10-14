declare module 'manageUsersApiClient' {
  import { components } from '../manageUsersApi'

  type BulkUserRoleAdditionsRequest = components['schemas']['BulkUserRoleAdditionsRequest']
  type BulkUserRoleAdditionsResponse = components['schemas']['BulkUserRoleAdditionsResponse']
  type BulkUserRoleAdditionsJobSummary = components['schemas']['BulkUserRoleAdditionsJobSummary']
  type BulkUserRoleAdditionsJobDetails = components['schemas']['BulkUserRolesAdditionsDetails']
  type ChildGroup = components['schemas']['ChildGroupDetailsDto']
  type CreateChildGroupRequest = components['schemas']['CreateChildGroupDto']
  type CreateEmailDomainRequest = components['schemas']['CreateEmailDomainDto']
  type CreateExternalUserRequest = components['schemas']['NewUser']
  type CreateGroupRequest = components['schemas']['CreateGroupDto']
  type CreateLinkedCentralAdminRequest = components['schemas']['CreateLinkedCentralAdminUserRequest']
  type CreateLinkedGeneralUserRequest = components['schemas']['CreateLinkedGeneralUserRequest']
  type CreateLinkedLocalAdminRequest = components['schemas']['CreateLinkedLocalAdminUserRequest']
  type CreateRoleRequest = components['schemas']['CreateRoleDto']
  type CreateUserRequest = components['schemas']['CreateUserRequest']
  type EmailAddress = components['schemas']['EmailAddressDto']
  type UserEmailAddress = EmailAddress & { email: string }
  type EmailDomain = components['schemas']['EmailDomainDto']
  type ErrorResponse = components['schemas']['ErrorResponse']
  type ExternalUser = components['schemas']['ExternalUserDetailsDto']
  type ExternalUserRole = components['schemas']['ExternalUserRole']
  type Group = components['schemas']['GroupDetailsDto']
  type NotificationMessage = components['schemas']['NotificationMessage']
  type PrisonAdminUserSummary = components['schemas']['PrisonAdminUserSummary']
  type PrisonCaseload = components['schemas']['PrisonCaseload']
  type PrisonStaffNewUser = components['schemas']['NewPrisonUserDto']
  type PrisonStaffUser = components['schemas']['PrisonStaffUserDto']
  type PrisonUserDetails = components['schemas']['PrisonUserDetails']
  type PrisonUserGroupDetail = components['schemas']['PrisonUserGroupDetail']
  type PrisonUserSearchSummary = components['schemas']['PrisonUserSearchSummary']
  type PrisonUserDownloadSummary = components['schemas']['PrisonUserDownloadSummary']
  type PrisonUserSummary = components['schemas']['PrisonUserSummary']
  type Role = components['schemas']['RoleDto']
  type RoleAdminType = components['schemas']['AdminTypeReturn']
  type RoleDetail = components['schemas']['RoleDetail']
  type UpdateGroupNameRequest = components['schemas']['GroupAmendmentDto']
  type UpdateRoleAdminTypeRequest = components['schemas']['RoleAdminTypeAmendmentDto']
  type UpdateRoleDescriptionRequest = components['schemas']['RoleDescriptionAmendmentDto']
  type UpdateRoleNameRequest = components['schemas']['RoleNameAmendmentDto']
  type UpdateUserEmailRequest = components['schemas']['AmendUser']
  type User = components['schemas']['User']
  type UserAllowlistAddRequest = components['schemas']['UserAllowlistAddRequest']
  type UserAllowlistDetail = components['schemas']['UserAllowlistDetail']
  type UserAllowlistPatchRequest = components['schemas']['UserAllowlistPatchRequest']
  type UserCaseloadDetail = components['schemas']['UserCaseloadDetail']
  type UserDetails = components['schemas']['UserDetailsDto']
  type UserGroup = components['schemas']['UserGroup']
  type UserRole = {
    roleCode: string
    roleName: string
    roleDescription: string
  }
  type UserRoleDetail = components['schemas']['UserRoleDetail']
  interface PagedList<T> {
    content: T[]
    pageable: components['schemas']['PageDetails']
    last: boolean
    /** Format: int32 */
    totalPages: number
    /** Format: int64 */
    totalElements: number
    /** Format: int32 */
    size: number
    /** Format: int32 */
    number: number
    sort: components['schemas']['PageSort']
    /** Format: int32 */
    numberOfElements: number
    first: boolean
    empty: boolean
  }
  interface UserAllowlistQuery {
    name?: string
    status?: string
    userType?: string
    size: number
    page: number
  }
  interface DpsUserSearchQuery {
    nameFilter?: string
    accessRoles?: string[]
    status?: string
    caseload?: string
    activeCaseload?: string
    inclusiveRoles?: boolean
    showOnlyLSAs?: boolean
    size?: number
    page?: number
  }
  interface RoleSearchQuery {
    roleName?: string
    roleCode?: string
    adminTypes?: string[]
    size?: number
    page?: number
  }
}
