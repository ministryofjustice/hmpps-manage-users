import { Router } from 'express'
import { RoleAdminType } from 'manageUsersApiClient'
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
import { validateRoleAdminType } from '../../presentation/validation/roleValidation'
import { HttpStatusCode, isErrorResponse, toArray } from '../../utils/utils'
import { RoleRequest } from './types'
import { adminTypeItemsDisablingImmutable } from '../../presentation/roles'
import { EventType } from '../audit'

interface Form {
  adminType: string[]
}

const validate = (body: Form): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateRoleAdminType(toArray(body.adminType)))

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
    const adminType =
      body.adminType !== undefined
        ? body.adminType
        : roleDetails.adminType.map((aType: RoleAdminType) => aType.adminTypeCode)

    return res.render('pages/roles/changeAdminType', {
      ...body,
      title: `Change role admin type for ${roleDetails.roleName}`,
      adminTypeValues: adminTypeItemsDisablingImmutable(adminType),
      adminType,
      roleUrl,
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, req =>
      paths.roles.changeRoleAdminType({ role: (req as RoleRequest).roleDetails.roleCode }),
    ),
    async (req, res) => {
      const { auditService, rolesService } = services
      const body = bodyFromFlash<Form>(req)
      const { username, token } = res.locals.user
      const { roleDetails } = req as RoleRequest
      const adminType = toArray(body.adminType)
      const errors: FormError[] = []
      try {
        await rolesService.changeRoleAdminType(token, roleDetails.roleCode, { adminType })
      } catch (err) {
        if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.BAD_REQUEST && err.data) {
          const { userMessage } = err.data
          const errorDetails = { text: userMessage ?? 'Unable to change the role administrator type' }
          errors.push(errorDetails)
        } else {
          throw err
        }
      }
      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(paths.roles.changeRoleAdminType({ role: roleDetails.roleCode }))
      }
      await auditService.logAuditEvent({
        what: EventType.UPDATE_ROLE,
        who: username,
        subjectId: roleDetails.roleCode,
        subjectType: 'ROLE_CODE',
        details: { newAdminType: adminType },
      })
      return res.redirect(paths.roles.details({ role: roleDetails.roleCode }))
    },
  )

  return router
}
