import { Router } from 'express'
import { RoleSearchQuery } from 'manageUsersApiClient'
import { Services } from '../../services'
import { formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import paths from '../paths'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { Filter } from '../../presentation/roles'
import { toArray } from '../../utils/utils'
import { Page } from '../audit'

interface Query extends Filter {
  page?: number
}

const size = 20
const convertQuery = (query: Query): RoleSearchQuery => {
  return {
    ...query,
    adminTypes: query.adminType === 'ALL' ? [] : toArray(query.adminType),
    size,
  }
}

export default (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.ROLES_ADMIN, AuthRole.VIEW_ADMINISTRABLE_USER_ROLES]))

  router.get('/', async (req, res) => {
    const { auditService, rolesService, paginationService } = services
    const { user } = res.locals
    const errors = formErrorsFromFlash(req)
    const maintainUrl = paths.roles.list.pattern
    const currentFilter: Query = {
      ...req.query,
      adminType: (req.query.adminType as string) || 'ALL',
      page: Number(req.query.page ?? '0'),
    }

    const { content, totalElements, number } = await rolesService.getPagedRoles(user.token, convertQuery(currentFilter))

    await auditService.logPageView(Page.VIEW_ROLE_LIST, {
      who: user.username,
      details: Object.freeze(currentFilter),
    })

    return res.render('pages/roles/list', {
      currentFilter,
      pagination: paginationService.getPagination(
        { totalElements, page: number, size },
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      roles: content,
      maintainUrl,
      errors,
    })
  })

  return router
}
