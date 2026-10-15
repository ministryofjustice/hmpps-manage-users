import { Router } from 'express'
import { Services } from '../../services'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import paths from '../paths'
import { FormError } from '../../interfaces/formError'
import { validateRoleDescription } from '../../presentation/validation/roleValidation'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { RoleRequest } from './types'
import { EventType } from '../audit'

interface Form {
  roleDescription: string
}

const validate = (body: Form): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateRoleDescription(body.roleDescription))

  return errors
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.ROLES_ADMIN]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<Form>(req)
    const errors = formErrorsFromFlash(req)
    const { roleDetails } = req as RoleRequest
    const roleUrl = paths.roles.details({ role: roleDetails.roleCode })
    const roleDescription = body.roleDescription !== undefined ? body.roleDescription : roleDetails.roleDescription

    return res.render('pages/roles/changeDescription', {
      ...body,
      title: `Change role description for ${roleDetails.roleName}`,
      roleDescription,
      roleUrl,
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, req =>
      paths.roles.changeRoleDescription({ role: (req as RoleRequest).roleDetails.roleCode }),
    ),
    async (req, res) => {
      const { auditService, rolesService } = services
      const body = bodyFromFlash<Form>(req)
      const { username, token } = res.locals.user
      const { roleDetails } = req as RoleRequest
      const errors: FormError[] = []
      try {
        await rolesService.changeRoleDescription(token, roleDetails.roleCode, { roleDescription: body.roleDescription })
      } catch (err) {
        if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.BAD_REQUEST && err.data) {
          const { userMessage } = err.data
          const errorDetails = { text: userMessage ?? 'Unable to change the role description' }
          errors.push(errorDetails)
        } else {
          throw err
        }
      }
      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(paths.roles.changeRoleDescription({ role: roleDetails.roleCode }))
      }
      await auditService.logAuditEvent({
        what: EventType.UPDATE_ROLE,
        who: username,
        subjectId: roleDetails.roleCode,
        subjectType: 'ROLE_CODE',
        details: { newRoleDescription: body.roleDescription },
      })
      return res.redirect(paths.roles.details({ role: roleDetails.roleCode }))
    },
  )

  return router
}
