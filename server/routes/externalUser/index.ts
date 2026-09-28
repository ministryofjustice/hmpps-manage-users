import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import createRouter from './createRouter'
import { downloadHandler, searchExternalUserRouter } from './searchExternalUserRouter'
import detailsRouter from './manage/detailsRouter'
import selectRolesRouter from './manage/selectRolesRouter'
import removeRoleHandler from './manage/roleRemovalHandlers'
import selectGroupRouter from './manage/selectGroupRouter'
import removeGroupHandler from './manage/groupRemovalHandlers'
import { changeEmailRouter, changeEmailSuccessHandler } from './manage/changeEmailRouter'
import { activateHandler, deactivateHandler } from './manage/activationHandlers'
import deactivateReasonRouter from './manage/deactivateReasonRouter'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'

export default function index(services: Services): Router {
  const router = Router()

  router.use(paths.externalUser.create.pattern, createRouter(services))
  router.use(paths.externalUser.search.pattern, searchExternalUserRouter(services))
  router.use(
    paths.externalUser.download.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]),
    downloadHandler(services),
  )
  router.use(paths.externalUser.manage.details.pattern, detailsRouter(services))
  router.use(paths.externalUser.manage.selectRoles.pattern, selectRolesRouter(services))
  router.post(
    paths.externalUser.manage.roles.remove.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]),
    removeRoleHandler(services),
  )
  router.use(paths.externalUser.manage.selectGroup.pattern, selectGroupRouter(services))
  router.post(
    paths.externalUser.manage.groups.remove.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]),
    removeGroupHandler(services),
  )
  router.use(paths.externalUser.manage.changeEmail.pattern, changeEmailRouter(services))
  router.get(
    paths.externalUser.manage.changeEmailSuccess.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]),
    changeEmailSuccessHandler(services),
  )
  router.post(
    paths.externalUser.manage.activate.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]),
    activateHandler(services),
  )
  router.post(
    paths.externalUser.manage.deactivate.pattern,
    authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]),
    deactivateHandler(services),
  )
  router.use(paths.externalUser.manage.deactivateReason.pattern, deactivateReasonRouter(services))

  return router
}
