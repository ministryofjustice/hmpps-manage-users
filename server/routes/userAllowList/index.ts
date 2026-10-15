import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import addUserRouter from './addUserRouter'
import searchUserAllowListRouter, { downloadHandler } from './searchUserAllowListRouter'
import viewUserRouter from './manage/viewUserRouter'
import editUserRouter from './manage/editUserRouter'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'

export default function index(services: Services): Router {
  const router = Router()

  router.use(paths.userAllowList.search.pattern, searchUserAllowListRouter(services))
  router.use(
    paths.userAllowList.download.pattern,
    authRoleGuardMiddleware([AuthRole.MANAGE_USER_ALLOW_LIST]),
    downloadHandler(services),
  )
  router.use(paths.userAllowList.addUser.pattern, addUserRouter(services))
  router.use(paths.userAllowList.manage.view.pattern, viewUserRouter(services))
  router.use(paths.userAllowList.manage.edit.pattern, editUserRouter(services))

  return router
}
