import { Router } from 'express'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import { validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import paths from '../../paths'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import {
  dpsUserChangeEmailSuccessUrlProvider,
  dpsUserChangeEmailUrlProvider,
  dpsUserDetailsUrlProvider,
} from './common'
import {
  changeEmailGetHandler,
  changeEmailPostHandler,
  changeEmailSuccessHandler as commonChangeEmailSuccessHandler,
  Form,
  validate,
} from '../../userCommon/changeEmailHandlers'

const getUser = async (token: string, username: string, { dpsUserService, userService }: Services) => {
  const [user, email] = await Promise.all([
    dpsUserService.getDpsUser(token, username),
    userService.getUserEmail(token, username),
  ])
  return { ...user, email: email.email }
}

export const changeEmailRouter = (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  router.get(
    '/',
    changeEmailGetHandler(
      services,
      'Search for a DPS user',
      paths.dpsUser.search.pattern,
      dpsUserDetailsUrlProvider,
      getUser,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req => dpsUserChangeEmailUrlProvider(req.params.userId)),
    changeEmailPostHandler(
      services,
      ({ dpsUserService }, token, userId, email) => dpsUserService.changeEmail(token, userId, email),
      dpsUserChangeEmailUrlProvider,
      dpsUserChangeEmailSuccessUrlProvider,
    ),
  )

  return router
}

export const changeEmailSuccessHandler = (services: Services) =>
  commonChangeEmailSuccessHandler(services, dpsUserDetailsUrlProvider, getUser)
