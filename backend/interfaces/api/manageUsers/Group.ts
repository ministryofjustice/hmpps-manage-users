import { PagedListItem } from '../../pagedList'

export interface Group {
  groupCode: string
  groupName: string
  assignableRoles?: GroupAssignRole[]
  children?: Group[]
}

export interface GroupAssignRole {
  roleCode: string
  roleName: string
}

export interface Groups {
  groups: Group[]
}

export interface GroupNamePutRequest {
  groupName: string
}

export interface GroupPostRequest {
  groupCode: string
  groupName: string
}

export interface ChildGroupPostRequest {
  parentGroupCode: string
  groupCode: string
  groupName: string
}
