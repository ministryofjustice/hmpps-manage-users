import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import listRouter from './listRouter'
import createRouter from './createRouter'
import deleteRouter from './deleteRouter'

export default function index(services: Services): Router {
  const router = Router()

  router.use(paths.emailDomains.list.pattern, listRouter(services))
  router.use(paths.emailDomains.create.pattern, createRouter(services))
  router.use(paths.emailDomains.delete.pattern, deleteRouter(services))

  return router
}
