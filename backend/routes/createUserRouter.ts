import { Router } from 'express'
import { createUserFactory } from '../controllers/createUser'

const router = Router({ mergeParams: true })

const controller = () => {
  const { index: renderPage, post: postUser } = createUserFactory('/create-user-options')

  router.get('/', renderPage)
  router.post('/', postUser)
  return router
}

const createUserRouter: () => Router = () => controller()

export default createUserRouter
