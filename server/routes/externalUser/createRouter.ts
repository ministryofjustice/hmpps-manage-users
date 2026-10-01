import { Request, Response, Router } from 'express'
import { CreateExternalUserRequest } from 'manageUsersApiClient'
import paths from '../paths'
import type { FormError } from '../../interfaces/formError'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import type { Services } from '../../services'
import { HttpStatusCode, isErrorResponse, toStringArray } from '../../utils/utils'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'
import groupValues from '../../presentation/groups'
import { hasRole } from '../../interfaces/hmppsUser'
import { validateEmail, validateName } from '../../presentation/validation/userValidation'
import emailVerificationError from '../../presentation/errors'
import { EventType } from '../audit'

interface Form {
  email: string
  firstName: string
  lastName: string
  groupCode: string
}

const validate = (body: Form, _req: Request<unknown>, res: Response): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateEmail(body.email))

  errors.push(...validateName(body.firstName, 'firstName', 'First name', 2, 50))
  errors.push(...validateName(body.lastName, 'lastName', 'Last name', 2, 50))

  const isGroupManager = hasRole(res.locals.user, AuthRole.AUTH_GROUP_MANAGER)
  if (isGroupManager && (!body.groupCode || body.groupCode === '')) {
    errors.push({ href: '#groupCode', text: 'Select a group' })
  }

  return errors
}

const convertBody = (body: Form): CreateExternalUserRequest => {
  const { groupCode, ...withoutGroupCode } = body
  return {
    ...withoutGroupCode,
    groupCodes: toStringArray(groupCode),
  }
}

export default ({ externalUserService, auditService }: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<Form>(req)
    const errors = formErrorsFromFlash(req)
    const assignableGroups = await externalUserService.assignableGroups(res.locals.user.token)

    return res.render('pages/externalUser/create', {
      ...body,
      groupValues: groupValues(assignableGroups),
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<Form>(validate, _req => paths.externalUser.create.pattern),
    async (req: Request, res: Response) => {
      const body = bodyFromFlash<Form>(req)
      const { username, token } = res.locals.user
      const errors: FormError[] = []
      let userId: string = ''

      try {
        userId = await externalUserService.createExternalUser(token, convertBody(body))
      } catch (err) {
        let errorDetails: FormError | undefined
        if (isErrorResponse(err)) {
          if (err.responseStatus === HttpStatusCode.BAD_REQUEST && err.data) {
            errorDetails = { href: '#email', text: emailVerificationError(err) }
          } else if (err.responseStatus === HttpStatusCode.CONFLICT) {
            errorDetails = { href: '#email', text: 'Email already exists' }
          }
        }
        if (!errorDetails) {
          throw err
        }
        errors.push(errorDetails)
      }

      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(paths.externalUser.create.pattern)
      }

      await auditService.logAuditEvent({
        what: EventType.CREATE_EXTERNAL_USER,
        who: username,
        subjectId: userId,
        subjectType: 'USER_ID',
        details: { ...body },
      })

      return res.render('pages/externalUser/createSuccess', {
        email: body.email,
        detailsLink: paths.externalUser.manage.details({ userId }),
      })
    },
  )

  return router
}
