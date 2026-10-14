import { Router } from 'express'
import createUserRouter from './create/createUserRouter'
import createUserOptionRouter from './create/createUserOptionRouter'
import createDpsUserRouter from './create/createDpsUserRouter'
import createLinkedDpsUserRouter from './create/createLinkedDpsUserRouter'
import { downloadHandler, downloadLsaHandler, searchDpsUserRouter } from './searchDpsUserRouter'
import paths from '../paths'
import { Services } from '../../services'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'
import selectRolesRouter from './manage/selectRolesRouter'
import { removeRoleHandler, requestRoleRemovalHandler } from './manage/roleRemovalHandlers'
import selectCaseloadsRouter from './manage/selectCaseloadsRouter'
import removeCaseloadRouter from './manage/removeCaseloadRouter'
import detailsRouter from './manage/detailsRouter'
import { changeEmailRouter, changeEmailSuccessHandler } from './manage/changeEmailRouter'
import { activateHandler, deactivateHandler } from './manage/activationHandlers'
import setupRestrictedRoles from '../../middleware/route/restrictedRolesMiddleware'
import { RoleParam } from '../userCommon/paramTypes'

export default function index(services: Services): Router {
  const router = Router()

  router.use(paths.dpsUser.createUser.pattern, createUserRouter())
  router.use(paths.dpsUser.createUserOptions.pattern, createUserOptionRouter())
  router.use(paths.dpsUser.createDpsUser.pattern, createDpsUserRouter(services))
  router.use(paths.dpsUser.createLinkedDpsUser.pattern, createLinkedDpsUserRouter(services))
  router.use(paths.dpsUser.search.pattern, searchDpsUserRouter(services))
  router.use(
    paths.dpsUser.download.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    downloadHandler(services),
  )
  router.use(
    paths.dpsUser.downloadLsa.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    downloadLsaHandler(services),
  )
  router.use(paths.dpsUser.manage.selectRoles.pattern, selectRolesRouter(services))
  router.post(
    paths.dpsUser.manage.roles.remove.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    removeRoleHandler(services),
  )
  router.get(
    paths.dpsUser.manage.roles.requestRemoval.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    setupRestrictedRoles<RoleParam>(services),
    requestRoleRemovalHandler,
  )
  router.use(paths.dpsUser.manage.selectCaseloads.pattern, selectCaseloadsRouter(services))
  router.use(paths.dpsUser.manage.removeCaseload.pattern, removeCaseloadRouter(services))
  router.use(paths.dpsUser.manage.details.pattern, detailsRouter(services))
  router.use(paths.dpsUser.manage.changeEmail.pattern, changeEmailRouter(services))
  router.get(
    paths.dpsUser.manage.changeEmailSuccess.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    changeEmailSuccessHandler(services),
  )
  // having two authRoleGuardMiddleware after each other is effectively an AND
  router.post(
    paths.dpsUser.manage.activate.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    authRoleGuardMiddleware([AuthRole.MANAGE_NOMIS_USER_ACCOUNT]),
    activateHandler(services),
  )
  router.post(
    paths.dpsUser.manage.deactivate.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]),
    authRoleGuardMiddleware([AuthRole.MANAGE_NOMIS_USER_ACCOUNT]),
    deactivateHandler(services),
  )

  return router
}
