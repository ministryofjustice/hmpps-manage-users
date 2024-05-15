import { components } from './manageUsersApiImport'
import { PagedListItem } from '../interfaces/pagedList'

export type Role = components['schemas']['RoleDto']
export type RoleDetail = components['schemas']['RoleDetail']
export type UpdateRoleNameRequest = components['schemas']['RoleNameAmendmentDto']
export type UpdateRoleDescriptionRequest = components['schemas']['RoleDescriptionAmendmentDto']
export type UpdateRoleAdminTypeRequest = components['schemas']['RoleAdminTypeAmendmentDto']

export type Group = components['schemas']['GroupDetailsDto']
export type ChildGroup = components['schemas']['ChildGroupDetailsDto']
export type CreateGroupRequest = components['schemas']['CreateGroupDto']
export type CreateChildGroupRequest = components['schemas']['CreateChildGroupDto']
export type UpdateGroupNameRequest = components['schemas']['GroupAmendmentDto']

export type EmailAddress = {
  username?: string
  email?: string
  verified?: boolean
}
export type EmailDomain = components['schemas']['EmailDomainDto']
export type CreateEmailDomainRequest = components['schemas']['CreateEmailDomainDto']

export type ExternalUser = components['schemas']['ExternalUserDetailsDto'] & PagedListItem
export type ExternalUserRole = components['schemas']['ExternalUserRole']
export type CreateExternalUserRequest = components['schemas']['NewUser']
export type UpdateUserEmailRequest = components['schemas']['AmendUser']

export type NotificationMessage = components['schemas']['NotificationMessage']

export type User = components['schemas']['User']
export type UserDetails = components['schemas']['UserDetailsDto']
export type UserRole = components['schemas']['UserRole']
export type UserRoleDetail = components['schemas']['UserRoleDetail']
export type UserGroup = components['schemas']['UserGroup']
export type CreateUserRequest = components['schemas']['CreateUserRequest']

export type PrisonStaffUser = components['schemas']['PrisonStaffUserDto']
export type PrisonStaffNewUser = components['schemas']['NewPrisonUserDto']

export type CreateLinkedCentralAdminRequest = components['schemas']['CreateLinkedCentralAdminUserRequest']
export type CreateLinkedGeneralUserRequest = components['schemas']['CreateLinkedGeneralUserRequest']
export type CreateLinkedLocalAdminRequest = components['schemas']['CreateLinkedLocalAdminUserRequest']

export type PrisonCaseLoad = components['schemas']['PrisonCaseload']
