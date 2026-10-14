import { Request } from 'express'
import { Role } from 'manageUsersApiClient'

export type RoleRequest = Request & {
  roleDetails: Role
}
