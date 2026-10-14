import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import logger from '../../../logger'
import { ChildGroupRequest, GroupRequest } from './types'
import detailsRouter from './detailsRouter'
import listRouter from './listRouter'
import { createGroupRouter, createChildGroupRouter } from './createRouters'
import { changeGroupNameRouter, changeChildGroupNameRouter } from './changeNameRouters'
import { deleteRouter, deleteChildGroupRouter } from './deleteRouters'

export default function index(services: Services): Router {
  const router = Router()

  router.param('group', async (req, res, next, group: string) => {
    const { groupsService } = services
    const groupRequest = req as GroupRequest
    try {
      groupRequest.groupDetails = await groupsService.groupDetails(res.locals.user.token, group)
    } catch (err) {
      logger.info(`An error occurred while fetching group details for ${group}`, err)
      return res.redirect(paths.groups.list.pattern)
    }
    return next()
  })
  router.param('childGroup', async (req, res, next, childGroup: string) => {
    const { groupsService } = services
    const childGroupRequest = req as ChildGroupRequest
    try {
      childGroupRequest.childGroupDetails = await groupsService.childGroupDetails(res.locals.user.token, childGroup)
    } catch (err) {
      logger.info(`An error occurred while fetching child group details for ${childGroup}`, err)
      return res.redirect(paths.groups.list.pattern)
    }
    return next()
  })
  router.use(paths.groups.create.pattern, createGroupRouter(services))
  router.use(paths.groups.details.pattern, detailsRouter(services))
  router.use(paths.groups.list.pattern, listRouter(services))
  router.use(paths.groups.changeGroupName.pattern, changeGroupNameRouter(services))
  router.use(paths.groups.delete.pattern, deleteRouter(services))
  router.use(paths.groups.changeChildGroupName.pattern, changeChildGroupNameRouter(services))
  router.use(paths.groups.createChildGroup.pattern, createChildGroupRouter(services))
  router.use(paths.groups.deleteChildGroup.pattern, deleteChildGroupRouter(services))

  return router
}
