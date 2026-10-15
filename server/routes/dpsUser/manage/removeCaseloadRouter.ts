import { Router, Request } from 'express'
import { Services } from '../../../services'
import { CaseloadParam } from '../../userCommon/paramTypes'
import paths from '../../paths'
import { HttpStatusCode, isErrorResponse } from '../../../utils/utils'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { EventType } from '../../audit'

export default ({ dpsUserService, auditService }: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  router.post('/', async (req: Request<CaseloadParam>, res) => {
    const { userId, caseload } = req.params
    const { username, token } = res.locals.user
    const staffUrl = paths.dpsUser.manage.details({ userId })

    try {
      await dpsUserService.removeCaseload(token, userId, caseload)
      await auditService.logAuditEvent({
        what: EventType.REMOVE_USER_CASELOAD,
        who: username,
        subjectId: userId,
        subjectType: 'USER_ID',
        details: { caseload },
      })
      return res.redirect(staffUrl)
    } catch (err) {
      if (!isErrorResponse(err)) {
        throw err
      }
      switch (err.responseStatus) {
        case HttpStatusCode.BAD_REQUEST: // role already removed from user
          return res.redirect(staffUrl)
        case HttpStatusCode.NOT_FOUND:
          return res.redirect(staffUrl)
        default:
          throw err
      }
    }
  })

  return router
}
