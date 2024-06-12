import { Router } from 'express'
import { createDpsUserFactory } from '../controllers/createDpsUser'
import { CreateUserRequest } from '../@types/manageUsersApi'
import { Context } from '../interfaces/context'
import { ManageUsersApi } from '../api/manageUsersApi'

const router = Router({ mergeParams: true })

const controller = (manageUsersApi: ManageUsersApi): Router => {
  const getAllCaseloads = manageUsersApi.getCaseloads
  const createUser = (context: Context, user: CreateUserRequest) => manageUsersApi.createUser(context, user)

  const { index: renderPage, post: postDpsUser } = createDpsUserFactory(
    getAllCaseloads,
    createUser,
    '/create-user',
    '/manage-dps-users',
  )

  router.get('/', renderPage)
  router.post('/', postDpsUser)
  return router
}

const createDpsUserRouter: (manageUsersApi: ManageUsersApi) => Router = (manageUsersApi: ManageUsersApi) =>
  controller(manageUsersApi)

export default createDpsUserRouter
