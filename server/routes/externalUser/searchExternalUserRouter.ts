import { RequestHandler, Router } from 'express'
import { Parser } from '@json2csv/plainjs'
import { ExternalUser } from 'manageUsersApiClient'
import { Services } from '../../services'
import { downloadCsv } from '../../middleware/route/downloadMiddleware'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { asUrlSearchParams, canDownload, Filter } from '../../presentation/searchExternalUser'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { EventType } from '../audit'

interface Query extends Filter {
  page?: number
}

const size = 20

export const searchExternalUserRouter = ({
  externalUserService,
  auditService,
  paginationService,
}: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get('/', async (req, res) => {
    const { user } = res.locals
    const [groups, roles] = await Promise.all([
      externalUserService.assignableGroups(user.token),
      externalUserService.getSearchableRoles(user.token),
    ])

    const currentFilter: Query = {
      user: (req.query.user as string)?.trim(),
      status: (req.query.status as string) || 'ALL',
      roleCode: req.query.roleCode as string,
      groupCode: req.query.groupCode as string,
      page: Number(req.query.page ?? '0'),
    }

    const searchParams = asUrlSearchParams(currentFilter)
    const correlationId = crypto.randomUUID()

    const audit = async (eventType: EventType) => {
      await auditService.logAuditEvent({
        what: eventType,
        who: user.username,
        details: Object.freeze(currentFilter),
        correlationId,
      })
    }

    await audit(EventType.SEARCH_USER_ATTEMPT)
    try {
      const { content, totalElements, number } = await externalUserService.searchUsers(
        user.token,
        {
          nameFilter: currentFilter.user,
          role: currentFilter.roleCode,
          group: currentFilter.groupCode,
          status: currentFilter.status,
        },
        currentFilter.page,
        size,
      )

      const queryString = searchParams.toString()
      req.session.searchResultsUrl = req.originalUrl
      return res.render('pages/externalUser/search', {
        groups,
        roles,
        currentFilter,
        results: content,
        pagination: paginationService.getPagination(
          { totalElements, page: number, size },
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
        ),
        searchUrl: paths.externalUser.search.pattern,
        downloadUrl: canDownload(user) && `${paths.externalUser.download.pattern}?${queryString}`,
      })
    } catch (err) {
      await audit(EventType.SEARCH_USER_FAILURE)
      throw err
    }
  })

  return router
}

export const downloadHandler = ({
  externalUserService,
  auditService,
}: Services): RequestHandler<unknown, unknown, unknown, Query> => {
  return downloadCsv<Query, ExternalUser[]>(
    'external-user-search.csv',
    auditService,
    async (query, token): Promise<ExternalUser[]> => {
      const result = await externalUserService.searchUsers(
        token,
        {
          nameFilter: query.user,
          role: query.roleCode,
          group: query.groupCode,
          status: query.status,
        },
        0,
        10000,
      )
      return result.content
    },
    (data: ExternalUser[]): string => {
      const fields = ['userId', 'username', 'email', 'enabled', 'locked', 'verified', 'firstName', 'lastName']
      return new Parser({ fields }).parse(data)
    },
    canDownload,
  )
}
