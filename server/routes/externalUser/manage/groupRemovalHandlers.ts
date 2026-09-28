import { Request, Response } from 'express'
import { Services } from '../../../services'
import paths from '../../paths'
import { flashErrors } from '../../../middleware/route/formMiddleware'
import { HttpStatusCode, isErrorResponse } from '../../../utils/utils'
import { GroupParam } from '../../userCommon/paramTypes'
import { FormError } from '../../../interfaces/formError'
import { EventType } from '../../audit'

export default (services: Services) => async (req: Request<GroupParam>, res: Response) => {
  const { userId, group } = req.params
  const { username, token } = res.locals.user
  const { externalUserService, auditService } = services
  const errors: FormError[] = []

  try {
    await externalUserService.removeGroup(token, userId, group)
    await auditService.logAuditEvent({
      what: EventType.REMOVE_USER_GROUP,
      who: username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { group },
    })
  } catch (err) {
    if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.FORBIDDEN) {
      errors.push({
        href: '#groups',
        text: 'You are not allowed to remove the last group from this user, please deactivate their account instead',
      })
      flashErrors(req, errors)
    } else {
      throw err
    }
  }
  return res.redirect(paths.externalUser.manage.details({ userId }))
}
