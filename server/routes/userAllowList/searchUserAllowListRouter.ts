import { RequestHandler, Router } from 'express'
import { Parser } from '@json2csv/plainjs'
import { UserAllowlistDetail } from 'manageUsersApiClient'
import { Services } from '../../services'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { downloadCsv } from '../../middleware/route/downloadMiddleware'
import paths from '../paths'
import { asUrlSearchParams, canDownload, displayUsers, Filter } from '../../presentation/userAllowList'
import manageUserAllowListHelper from '../../utils/manageUserAllowListHelper'
import { EventType } from '../audit'

const pageSize = manageUserAllowListHelper.pageSize()
const downloadLimit = manageUserAllowListHelper.downloadLimit()

export interface Query extends Filter {
  page: number
}

export default ({ userAllowListService, paginationService, auditService }: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_ALLOW_LIST]))

  router.get('/', async (req, res) => {
    const { user } = res.locals
    const currentFilter: Query = {
      user: (req.query.user as string)?.trim(),
      status: (req.query.status as string) || 'ALL',
      userType: req.query.userType === 'DIGITAL' || req.query.userType === 'GENERAL' ? req.query.userType : undefined,
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
      const { content, totalElements, number } = await userAllowListService.getAllAllowListUsers(user.token, {
        name: currentFilter.user,
        status: currentFilter.status,
        userType: currentFilter.userType,
        page: currentFilter.page,
        size: pageSize,
      })
      const downloadUrl = `${paths.userAllowList.download.pattern}?${searchParams.toString()}`

      return res.render('pages/userAllowList/search', {
        currentFilter,
        results: displayUsers(content),
        pagination: paginationService.getPagination(
          { totalElements, page: number, size: pageSize },
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
        ),
        searchUrl: paths.userAllowList.search.pattern,
        downloadUrl,
        showDownloadLink: canDownload(user) && totalElements <= downloadLimit ? true : undefined,
        downloadLimit,
      })
    } catch (err) {
      await audit(EventType.SEARCH_USER_FAILURE)
      throw err
    }
  })

  return router
}

export const downloadHandler = ({
  userAllowListService,
  auditService,
}: Services): RequestHandler<unknown, unknown, unknown, Filter> =>
  downloadCsv<Filter, UserAllowlistDetail[]>(
    'user-allowlist-search.csv',
    auditService,
    async (query: Filter, token: string): Promise<UserAllowlistDetail[]> => {
      const result = await userAllowListService.getAllAllowListUsers(token, {
        name: query.user,
        status: query.status,
        userType: query.userType,
        page: 0,
        size: downloadLimit,
      })
      return result.content
    },
    (data: UserAllowlistDetail[]): string => {
      const fields = [
        'username',
        'firstName',
        'lastName',
        'email',
        'reason',
        'allowlistEndDate',
        'createdOn',
        'lastUpdated',
        'lastUpdatedBy',
        'status',
        'userType',
        'approver',
      ]
      return new Parser({ fields }).parse(displayUsers(data))
    },
    canDownload,
  )
