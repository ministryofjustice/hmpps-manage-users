import { Router } from 'express'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import { validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import paths from '../../paths'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import {
  changeEmailGetHandler,
  changeEmailPostHandler,
  changeEmailSuccessHandler as commonChangeEmailSuccessHandler,
  Form,
  validate,
} from '../../userCommon/changeEmailHandlers'
import {
  externalUserChangeEmailSuccessUrlProvider,
  externalUserChangeEmailUrlProvider,
  externalUserDetailsUrlProvider,
} from './common'

const getUser = async (token: string, username: string, { externalUserService }: Services) => {
  return externalUserService.getUser(token, username)
}

export const changeEmailRouter = (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]))

  router.get(
    '/',
    changeEmailGetHandler(
      services,
      'Search for an external user',
      paths.externalUser.search.pattern,
      externalUserDetailsUrlProvider,
      getUser,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req => externalUserChangeEmailUrlProvider(req.params.userId)),
    changeEmailPostHandler(
      services,
      ({ externalUserService }, token, userId, email) => externalUserService.changeEmail(token, userId, email),
      externalUserChangeEmailUrlProvider,
      externalUserChangeEmailSuccessUrlProvider,
    ),
  )

  return router
}

export const changeEmailSuccessHandler = (services: Services) =>
  commonChangeEmailSuccessHandler(services, externalUserDetailsUrlProvider, getUser)
