import { Router } from 'express'
import { CreateRoleRequest } from 'manageUsersApiClient'
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
import { adminTypeItems } from '../../presentation/roles'
import {
  validateRoleAdminType,
  validateRoleCode,
  validateRoleDescription,
  validateRoleName,
} from '../../presentation/validation/roleValidation'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { EventType } from '../audit'

const validate = (body: CreateRoleRequest): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateRoleName(body.roleName))
  errors.push(...validateRoleCode(body.roleCode))
  errors.push(...validateRoleDescription(body.roleDescription))
  errors.push(...validateRoleAdminType(body.adminType))

  return errors
}

export default (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.ROLES_ADMIN]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<CreateRoleRequest>(req)
    const errors = formErrorsFromFlash(req)
    const roleListUrl = paths.roles.list.pattern

    return res.render('pages/roles/create', {
      ...body,
      roleListUrl,
      adminTypeValues: adminTypeItems(),
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, _req => paths.roles.create.pattern),
    async (req, res) => {
      const { auditService, rolesService } = services
      const body = bodyFromFlash<CreateRoleRequest>(req)
      const { username, token } = res.locals.user
      const errors: FormError[] = []
      try {
        await rolesService.createRole(token, body)
      } catch (err) {
        if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.CONFLICT && err.data) {
          errors.push({ href: '#roleCode', text: 'Role code already exists' })
        } else {
          throw err
        }
      }
      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(paths.roles.create.pattern)
      }
      await auditService.logAuditEvent({
        what: EventType.CREATE_ROLE,
        who: username,
        subjectId: body.roleCode,
        subjectType: 'ROLE_CODE',
        details: body,
      })
      return res.redirect(paths.roles.details({ role: body.roleCode }))
    },
  )

  return router
}
