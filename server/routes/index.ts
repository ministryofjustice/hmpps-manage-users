import { Router } from 'express'

import type { Services } from '../services'
import menuRouter from './menuRouter'
import dpsUserRouter from './dpsUser'
import emailDomainsRouter from './emailDomains'
import groupsRouter from './groups'
import rolesRouter from './roles'
import crsGroupsRouter from './crsGroups'
import externalUserRouter from './externalUser'
import userAllowListRouter from './userAllowList'
import bulkUserRolesRouter from './bulkUserRoles'

export default function routes(services: Services): Router {
  const router = Router()

  router.use(menuRouter(services))
  router.use(dpsUserRouter(services))
  router.use(emailDomainsRouter(services))
  router.use(groupsRouter(services))
  router.use(rolesRouter(services))
  router.use(crsGroupsRouter(services))
  router.use(externalUserRouter(services))
  router.use(userAllowListRouter(services))
  router.use(bulkUserRolesRouter(services))

  return router
}
