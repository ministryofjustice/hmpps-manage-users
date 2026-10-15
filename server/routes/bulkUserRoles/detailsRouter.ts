import { Router } from 'express'
import { Services } from '../../services'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { Page } from '../audit'
import { BulkUserRoleAdditionsJobIdParam } from './types'
import paths from '../paths'

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })
  const { auditService, bulkUserRolesService } = services

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_BULK_JOBS]))

  router.get<BulkUserRoleAdditionsJobIdParam>('/', async (req, res) => {
    const { id } = req.params
    const { user } = res.locals
    const backUrl = paths.bulkUserRoles.view.list.pattern
    const downloadUrl = paths.bulkUserRoles.view.download({ id })

    try {
      const details = await bulkUserRolesService.getBulkUserRoleAdditionsJob(user.token, id)

      await auditService.logPageView(Page.VIEW_BULK_USER_ROLE_ADDITIONS_DETAILS, {
        who: user.username,
        subjectId: id,
        subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
      })

      return res.render('pages/bulkUserRoles/viewRequestDetails', { details, backUrl, downloadUrl })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      return res.render('pages/bulkUserRoles/viewRequestDetails', {
        getRequestDetailsError: errorMessage,
        backUrl,
      })
    }
  })

  return router
}
