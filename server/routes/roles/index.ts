import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import createRouter from './createRouter'
import detailsRouter from './detailsRouter'
import listRouter from './listRouter'
import changeNameRouter from './changeNameRouter'
import changeDescriptionRouter from './changeDescriptionRouter'
import changeAdminTypeRouter from './changeAdminTypeRouter'
import logger from '../../../logger'
import { RoleRequest } from './types'

export default function index(services: Services): Router {
  const router = Router()

  router.param('role', async (req, res, next, role: string) => {
    const { rolesService } = services
    const roleRequest = req as RoleRequest
    try {
      roleRequest.roleDetails = await rolesService.getRoleDetails(res.locals.user.token, role)
    } catch (err) {
      logger.info(`An error occurred while fetching role details for ${role}`, err)
      return res.redirect(paths.roles.list.pattern)
    }
    return next()
  })

  router.use(paths.roles.create.pattern, createRouter(services))
  router.use(paths.roles.details.pattern, detailsRouter(services))
  router.use(paths.roles.list.pattern, listRouter(services))
  router.use(paths.roles.changeRoleName.pattern, changeNameRouter(services))
  router.use(paths.roles.changeRoleDescription.pattern, changeDescriptionRouter(services))
  router.use(paths.roles.changeRoleAdminType.pattern, changeAdminTypeRouter(services))

  return router
}
