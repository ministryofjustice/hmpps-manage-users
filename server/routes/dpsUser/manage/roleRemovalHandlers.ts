import { Request, Response } from 'express'
import { telemetry } from '@ministryofjustice/hmpps-azure-telemetry'
import { Services } from '../../../services'
import paths from '../../paths'
import { RoleParam } from '../../userCommon/paramTypes'
import { Event } from '../../../utils/azureAppInsights'
import { getRemovalMessage } from '../../../presentation/restrictedRoles'
import { dpsUserDetailsUrlProvider } from './common'
import removeRoleHandlerCommon from '../../userCommon/roleRemovalHandlers'

export const removeRoleHandler = (services: Services) =>
  removeRoleHandlerCommon(
    services,
    ({ dpsUserService }, token, userId, role) => dpsUserService.removeRole(token, userId, role),
    dpsUserDetailsUrlProvider,
  )

export const requestRoleRemovalHandler = async (req: Request<RoleParam>, res: Response) => {
  const { userId, role } = req.params
  const { username } = res.locals.user
  const staffDetailsUrl = paths.dpsUser.manage.details({ userId })

  telemetry.trackEvent(Event.REQUEST_REMOVE_USER_ROLE_ATTEMPT, { username, userId, roleCode: role })
  const removalMessage = getRemovalMessage(role, res.locals.restrictedRoles)

  res.render('pages/dpsUser/requestUserRoleRemoval', {
    staffDetailsUrl,
    removalMessage,
  })
}
