import { RequestHandler, Router } from 'express'
import { Parser } from '@json2csv/plainjs'
import { unwind } from '@json2csv/transforms'
import { DpsUserSearchQuery, PrisonAdminUserSummary, PrisonUserDownloadSummary } from 'manageUsersApiClient'
import { Services } from '../../services'
import { downloadCsv } from '../../middleware/route/downloadMiddleware'
import { hasRole } from '../../interfaces/hmppsUser'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { asUrlSearchParams, canDownload, Filter } from '../../presentation/searchDpsUser'
import config from '../../config'
import { toArray, toBoolean } from '../../utils/utils'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { EventType } from '../audit'

interface Query extends Filter {
  page?: number
}

const size = 20
const convertQuery = (query: Query): DpsUserSearchQuery => {
  return {
    ...query,
    nameFilter: query.user?.trim(),
    caseload: query.groupCode,
    accessRoles: query.roleCode,
    activeCaseload: query.restrictToActiveGroup ? query.groupCode : undefined,
    size,
    status: query.status || 'ALL',
  }
}

export const searchDpsUserRouter = ({
  dpsUserService,
  rolesService,
  auditService,
  paginationService,
}: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  router.get('/', async (req, res) => {
    const { user } = res.locals
    const [roles, caseloads] = await Promise.all([
      rolesService.getRolesForMaintainAccessRolesUser(user),
      dpsUserService.getCaseloads(user.token),
    ])
    const showPrisonDropdown = hasRole(user, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN)
    const currentFilter: Query = {
      ...req.query,
      user: (req.query.user as string)?.trim(),
      status: (req.query.status as string) || 'ALL',
      roleCode: toArray(req.query.roleCode as string[]),
      restrictToActiveGroup: (req.query.restrictToActiveGroup as string) !== 'false',
      inclusiveRoles: toBoolean(req.query.inclusiveRoles as string),
      showOnlyLSAs: toBoolean(req.query.showOnlyLSAs as string),
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
      const { content, totalElements, number } = await dpsUserService.dpsUserSearch(
        user.token,
        convertQuery(currentFilter),
      )

      const queryString = searchParams.toString()
      req.session.searchResultsUrl = req.originalUrl
      return res.render('pages/dpsUser/search', {
        showPrisonDropdown,
        roles,
        caseloads,
        currentFilter,
        results: content,
        pagination: paginationService.getPagination(
          { totalElements, page: number, size },
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
        ),
        searchUrl: `${paths.dpsUser.search.pattern}`,
        downloadUrl: canDownload(user) && `${paths.dpsUser.download.pattern}?${queryString}`,
        hideDownloadLink: canDownload(user) && totalElements > config.downloadRecordLimit ? true : undefined,
        lsaDownloadUrl:
          canDownload(user) && currentFilter.showOnlyLSAs && `${paths.dpsUser.downloadLsa.pattern}?${queryString}`,
        hideLsaDownloadLink: canDownload(user) && totalElements > config.downloadRecordLimit ? true : undefined,
        downloadRecordLimit: config.downloadRecordLimit,
      })
    } catch (err) {
      await audit(EventType.SEARCH_USER_FAILURE)
      throw err
    }
  })

  return router
}

export const downloadHandler = ({
  dpsUserService,
  auditService,
}: Services): RequestHandler<unknown, unknown, unknown, Query> => {
  return downloadCsv<Query, PrisonUserDownloadSummary[]>(
    'user-search.csv',
    auditService,
    (query, token): Promise<PrisonUserDownloadSummary[]> =>
      dpsUserService.downloadUserSearch(token, convertQuery(query)),
    (data: PrisonUserDownloadSummary[]): string => {
      const fields = [
        {
          label: 'staffId',
          value: 'staffId',
        },
        {
          label: 'username',
          value: 'username',
        },
        {
          label: 'firstName',
          value: 'firstName',
        },
        {
          label: 'lastName',
          value: 'lastName',
        },
        {
          label: 'activeCaseLoadId',
          value: 'activeCaseload.id',
        },
        {
          label: 'accountStatus',
          value: 'status',
        },
        {
          label: 'lockedFlag',
          value: 'locked',
        },
        {
          label: 'expiredFlag',
          value: 'expired',
        },
        {
          label: 'active',
          value: 'active',
        },
        {
          label: 'email',
          value: 'email',
        },
        {
          label: 'dpsRoleCount',
          value: 'dpsRoleCount',
        },
      ]

      const json2csvParser = new Parser({ fields })
      return json2csvParser.parse(data)
    },
  )
}

export const downloadLsaHandler = ({
  dpsUserService,
  auditService,
}: Services): RequestHandler<unknown, unknown, unknown, Query> => {
  return downloadCsv<Query, PrisonAdminUserSummary[]>(
    'lsa-report.csv',
    auditService,
    (query, token): Promise<PrisonAdminUserSummary[]> => dpsUserService.downloadLsaSearch(token, convertQuery(query)),
    (data: PrisonAdminUserSummary[]): string => {
      const fields = [
        {
          label: 'staffId',
          value: 'staffId',
        },
        {
          label: 'username',
          value: 'username',
        },
        {
          label: 'firstName',
          value: 'firstName',
        },
        {
          label: 'lastName',
          value: 'lastName',
        },
        {
          label: 'activeCaseLoadId',
          value: 'activeCaseload.id',
        },
        {
          label: 'email',
          value: 'email',
        },
        {
          label: 'dpsRoleCount',
          value: 'dpsRoleCount',
        },
        {
          label: 'lsaCaseloadId',
          value: 'groups.id',
        },
        {
          label: 'lsaCaseload',
          value: 'groups.name',
        },
      ]

      const json2csvParser = new Parser({ fields, transforms: [unwind({ paths: ['groups'] })] })
      return json2csvParser.parse(data)
    },
  )
}
