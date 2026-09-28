import {
  CreateRoleRequest,
  PagedList,
  Role,
  RoleSearchQuery,
  UpdateRoleAdminTypeRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleNameRequest,
} from 'manageUsersApiClient'
import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { filterProtectedRoles, hasRole, HmppsUser } from '../interfaces/hmppsUser'
import AuthRole from '../interfaces/authRole'
import { toArray } from '../utils/utils'

export default class RolesService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  getAssignableRoles = async (user: HmppsUser): Promise<Role[]> => {
    return this.getRolesForMaintainAccessRolesUser(user).then(allAssignableRoles =>
      filterProtectedRoles(user, allAssignableRoles),
    )
  }

  getRolesForMaintainAccessRolesUser = async (user: HmppsUser): Promise<Role[]> =>
    this.getRoles(user.token, hasRole(user, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN) ? 'DPS_ADM' : 'DPS_LSA')

  getRoles = async (token: string, adminType: 'DPS_LSA' | 'DPS_ADM' | 'EXT_ADM' | 'IMS_HIDDEN'): Promise<Role[]> =>
    this.manageUsersApiClient.getRoles(token, adminType)

  getBannerMessage = async (token: string): Promise<string> =>
    this.manageUsersApiClient.getNotificationBannerMessage(token, 'ROLES').then(res => res.message)

  createRole = async (token: string, request: CreateRoleRequest): Promise<Role> =>
    this.manageUsersApiClient.createRole(token, {
      ...request,
      roleCode: request.roleCode
        .toUpperCase()
        .trim()
        .replace(/^ROLE_/, ''),
      adminType: toArray(request.adminType),
    })

  getRoleDetails = async (token: string, roleCode: string): Promise<Role> =>
    this.manageUsersApiClient.getRoleDetails(token, roleCode)

  getPagedRoles = async (token: string, query: RoleSearchQuery): Promise<PagedList<Role>> =>
    this.manageUsersApiClient.getPagedRoles(token, query)

  changeRoleName = async (token: string, roleCode: string, roleName: UpdateRoleNameRequest): Promise<Response> =>
    this.manageUsersApiClient.changeRoleName(token, roleCode, roleName)

  changeRoleDescription = async (
    token: string,
    roleCode: string,
    roleDescription: UpdateRoleDescriptionRequest,
  ): Promise<Response> => this.manageUsersApiClient.changeRoleDescription(token, roleCode, roleDescription)

  changeRoleAdminType = async (
    token: string,
    roleCode: string,
    adminType: UpdateRoleAdminTypeRequest,
  ): Promise<Response> => this.manageUsersApiClient.changeRoleAdminType(token, roleCode, adminType)
}
