import { Request, RequestHandler, Response } from 'express'
import { Services } from '../../services'
import { UserUrlProvider, UserParam } from './paramTypes'
import { EventType } from '../audit'

export type UserEnabler = (services: Services, token: string, userId: string) => Promise<unknown>
export type UserDisabler = (services: Services, token: string, userId: string) => Promise<unknown>

export const activateHandler =
  (services: Services, userEnabler: UserEnabler, detailsUrlProvider: UserUrlProvider): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const { username, token } = res.locals.user
    const { auditService } = services
    await userEnabler(services, token, userId)
    await auditService.logAuditEvent({
      what: EventType.ENABLE_USER,
      who: username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
    return res.redirect(detailsUrlProvider(userId))
  }

export const deactivateHandler =
  (services: Services, userDisabler: UserDisabler, detailsUrlProvider: UserUrlProvider): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const { username, token } = res.locals.user
    const { auditService } = services
    await userDisabler(services, token, userId)
    await auditService.logAuditEvent({
      what: EventType.DISABLE_USER,
      who: username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
    return res.redirect(detailsUrlProvider(userId))
  }
