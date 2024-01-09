import { PagedListItem } from '../../pagedList'

export interface Role extends PagedListItem {
  roleCode: string
  roleName: string
  roleDescription: string
  adminType: AdminType[]
}

export interface AdminType {
  adminTypeCode: string
  adminTypeName: string
}

export interface Roles {
  roles: Role[]
}

export interface AdminTypePutRequest {
    adminType: string[]
}

export interface RoleNamePutRequest {
  roleName: string
}

export interface RoleDescriptionPutRequest {
  roleDescription: string
}