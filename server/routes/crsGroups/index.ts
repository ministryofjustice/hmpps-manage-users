import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import selectionRouter, { downloadHandler } from './selectionRouter'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'

export default function index(services: Services): Router {
  const router = Router()

  router.use(
    paths.crsGroups.download.pattern,
    authRoleGuardMiddleware([AuthRole.CONTRACT_MANAGER_VIEW_GROUP]),
    downloadHandler(services),
  )
  router.use(paths.crsGroups.select.pattern, selectionRouter(services))

  return router
}
