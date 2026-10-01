import { Router } from 'express'
import { Services } from '../../services'
import { formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import paths from '../paths'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { hasRole } from '../../interfaces/hmppsUser'
import { RoleRequest } from './types'
import { Page } from '../audit'

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.ROLES_ADMIN, AuthRole.VIEW_ADMINISTRABLE_USER_ROLES]))

  router.get('/', async (req, res) => {
    const { auditService } = services
    const { user } = res.locals
    const hasRolesAdmin = hasRole(user, AuthRole.ROLES_ADMIN)
    const errors = formErrorsFromFlash(req)
    const maintainUrl = paths.roles.list.pattern
    const { roleDetails } = req as RoleRequest

    await auditService.logPageView(Page.VIEW_ROLE_DETAILS, {
      who: user.username,
      subjectId: roleDetails.roleCode,
      subjectType: 'ROLE_CODE',
    })

    return res.render('pages/roles/details', {
      roleDetails,
      hasRolesAdmin,
      maintainUrl,
      errors,
    })
  })

  return router
}
