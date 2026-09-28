import { Router } from 'express'
import { Services } from '../../services'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { EventType } from '../audit'
import logger from '../../../logger'
import { BulkUserRoleAdditionsJobIdParam } from './types'
import { isErrorResponse } from '../../utils/utils'

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })
  const { auditService, bulkUserRolesService } = services

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_BULK_JOBS]))

  router.get<BulkUserRoleAdditionsJobIdParam>('/', async (req, res) => {
    const { id } = req.params
    const { username, token } = res.locals.user

    await auditService.logAuditEvent({
      what: EventType.DOWNLOAD_BULK_USER_ROLE_ADDITIONS_CSV_ATTEMPT,
      who: username,
      subjectId: id,
      subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
    })

    try {
      const response = await bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv(token, id)

      // Explicitly set status 200 so the page doesn't load an error, even for an errored upstream download - the
      // downloaded file will still contain an error message, the error details are logged server side.
      res.status(200)
      res.set({
        'Content-Type': (response.headers?.['content-type'] as string) || 'text/csv',
        'Content-Disposition':
          (response.headers?.['content-disposition'] as string) ||
          `attachment; filename="bulk-roles-assignments-${id}.csv"`,
      })
      return res.send(response.text ?? response.body)
    } catch (err) {
      logger.error(`error downloading bulk additions results csv id: ${id}`, err)
      await auditService.logAuditEvent({
        what: EventType.DOWNLOAD_BULK_USER_ROLE_ADDITIONS_CSV_FAILURE,
        who: username,
        subjectId: id,
        subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
      })

      const message = isErrorResponse(err)
        ? ((err.data as unknown as { message?: string })?.message ?? 'An error occurred while downloading the results')
        : 'An error occurred while downloading the results'

      res.status(200)
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="bulk-roles-assignments-${id}-ERROR.json"`,
      })
      return res.send(JSON.stringify({ message }))
    }
  })

  return router
}
