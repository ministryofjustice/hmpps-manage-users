import { Services } from '../../../services'
import removeRoleHandlerCommon from '../../userCommon/roleRemovalHandlers'
import { externalUserDetailsUrlProvider } from './common'

export default (services: Services) =>
  removeRoleHandlerCommon(
    services,
    ({ externalUserService }, token, userId, role) => externalUserService.removeRole(token, userId, role),
    externalUserDetailsUrlProvider,
  )
