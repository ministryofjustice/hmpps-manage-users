import { RequestHandler, Router } from 'express'
import { Path } from 'static-path'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../paths'
import GroupSelectionRoutes from './groupSelection'
import { manageUsersApiBuilder } from '../../data'

export default function Index(): Router {
  const router = Router()

  const get = <T extends string>(routerPath: Path<T>, handler: RequestHandler) =>
    router.get(routerPath.pattern, asyncMiddleware(handler))

  const groupSelectionHandler = new GroupSelectionRoutes(manageUsersApiBuilder)
  get(paths.crsGroupSelection.groupsSelection, groupSelectionHandler.GET)
  get(paths.crsGroupSelection.download, groupSelectionHandler.DOWNLOAD)

  return router
}
