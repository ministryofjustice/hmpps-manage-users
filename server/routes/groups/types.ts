import { Request } from 'express'
import { ChildGroup, Group } from 'manageUsersApiClient'

export type GroupRequest = Request & {
  groupDetails: Group
}

export type ChildGroupRequest = GroupRequest & {
  childGroupDetails: ChildGroup
}

export type StringFromRequestProvider<GroupRequestType extends Request, Body = unknown> = (
  req: GroupRequestType,
  body?: Body,
) => string

export type AuditDetailsProvider<GroupRequestType extends Request, Body = unknown> = (
  req: GroupRequestType,
  body?: Body,
) => object
