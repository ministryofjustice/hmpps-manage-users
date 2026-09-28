import { Request, Response } from 'express'
import { Services } from '../../services'
import { RoleParam, UserUrlProvider } from './paramTypes'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { EventType } from '../audit'

type RoleRemover = (services: Services, token: string, userId: string, role: string) => Promise<void>

export default (services: Services, roleRemover: RoleRemover, userDetailsUrlProvider: UserUrlProvider) =>
  async (req: Request<RoleParam>, res: Response) => {
    const { userId, role } = req.params
    const { username, token } = res.locals.user
    const { auditService } = services

    try {
      await roleRemover(services, token, userId, role)
      await auditService.logAuditEvent({
        what: EventType.REMOVE_USER_ROLE,
        who: username,
        subjectId: userId,
        subjectType: 'USER_ID',
        details: { role },
      })
    } catch (err) {
      if (!isErrorResponse(err) || err.responseStatus !== HttpStatusCode.BAD_REQUEST) {
        throw err
      }
      // role already removed, continue to redirect
    }
    return res.redirect(userDetailsUrlProvider(userId))
  }
