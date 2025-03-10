import { RequestHandler, Router } from 'express'
import { Path } from 'static-path'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import paths from '../paths'
import AddUserRoutes from './addUser'
import SearchRoutes from './search'
import ViewUserRoutes from './viewUser'
import EditUserRoutes from './editUser'
import AllowListService from '../../services/userAllowListService'

export default function Index(): Router {
  const router = Router()
  const allowListService = new AllowListService()

  const get = <T extends string>(routerPath: Path<T>, handler: RequestHandler) =>
    router.get(routerPath.pattern, asyncMiddleware(handler))

  const post = <T extends string>(routerPath: Path<T>, handler: RequestHandler) =>
    router.post(routerPath.pattern, asyncMiddleware(handler))

  const addUserHandler = new AddUserRoutes(allowListService)
  get(paths.userAllowList.addUser, addUserHandler.GET)
  post(paths.userAllowList.addUser, addUserHandler.POST)

  const viewUserHandler = new ViewUserRoutes(allowListService)
  get(paths.userAllowList.viewUser, viewUserHandler.GET)

  const editUserHandler = new EditUserRoutes(allowListService)
  get(paths.userAllowList.editUser, editUserHandler.GET)
  post(paths.userAllowList.editUser, editUserHandler.POST)

  const searchHandler = new SearchRoutes(allowListService)
  get(paths.userAllowList.search, searchHandler.GET)

  return router
}
