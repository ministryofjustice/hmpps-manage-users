import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import createRouter from './createRouter'
import listRouter from './listRouter'
import detailsRouter from './detailsRouter'
import downloadRouter from './downloadRouter'

export default function index(services: Services): Router {
  const router = Router()

  router.use(paths.bulkUserRoles.create.root.pattern, createRouter(services))
  router.use(paths.bulkUserRoles.view.list.pattern, listRouter(services))
  router.use(paths.bulkUserRoles.view.details.pattern, detailsRouter(services))
  router.use(paths.bulkUserRoles.view.download.pattern, downloadRouter(services))

  return router
}
