import { Router } from 'express'
import { Services } from '../../services'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { Page } from '../audit'
import paths from '../paths'

const size = 20

export default (services: Services): Router => {
  const router = Router()
  const { auditService, bulkUserRolesService, paginationService } = services

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_BULK_JOBS]))

  router.get('/', async (req, res) => {
    const { user } = res.locals
    const page = Number(req.query.page ?? '0')
    const keyword = (req.query.keyword as string) || undefined

    try {
      const pagedResult = await bulkUserRolesService.getBulkUserRoleAdditionsJobs(user.token, page, size, keyword)

      await auditService.logPageView(Page.VIEW_BULK_USER_ROLE_ADDITIONS_LIST, {
        who: user.username,
        details: Object.freeze({ page, keyword }),
      })

      return res.render('pages/bulkUserRoles/viewRequests', {
        bulkUserRolesRequests: pagedResult.content,
        pagination: paginationService.getPagination(
          { totalElements: pagedResult.totalElements, page: pagedResult.number, size },
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
        ),
        detailsUrl: (id: string) => paths.bulkUserRoles.view.details({ id }),
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      return res.render('pages/bulkUserRoles/viewRequests', {
        getRequestsError: `API responded with: ${errorMessage}`,
      })
    }
  })

  return router
}
