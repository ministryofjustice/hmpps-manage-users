import { AuditServiceFactory } from '@ministryofjustice/hmpps-audit-client'
import { dataAccess } from '../data'
import MenuService from './menuService'
import DpsUserService from './dpsUserService'
import RolesService from './rolesService'
import UserService from './userService'
import EmailDomainsService from './emailDomainsService'
import GroupsService from './groupsService'
import ExternalUserService from './externalUserService'
import UserAllowListService from './userAllowListService'
import BulkUserRolesService from './bulkUserRolesService'
import paginationService from './paginationService'
import logger from '../../logger'
import config from '../config'
import { SubjectType } from '../routes/audit'

export const services = () => {
  const { applicationInfo, manageUsersApiClient } = dataAccess()

  const auditService = AuditServiceFactory.createInstance<string, SubjectType>(config.sqs.audit, logger)

  return {
    applicationInfo,
    auditService,
    menuService: new MenuService(manageUsersApiClient),
    dpsUserService: new DpsUserService(manageUsersApiClient),
    rolesService: new RolesService(manageUsersApiClient),
    userService: new UserService(manageUsersApiClient),
    emailDomainsService: new EmailDomainsService(manageUsersApiClient),
    groupsService: new GroupsService(manageUsersApiClient),
    externalUserService: new ExternalUserService(manageUsersApiClient),
    userAllowListService: new UserAllowListService(manageUsersApiClient),
    bulkUserRolesService: new BulkUserRolesService(manageUsersApiClient),
    paginationService,
  }
}

export type Services = ReturnType<typeof services>
