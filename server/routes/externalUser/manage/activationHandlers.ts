import { Services } from '../../../services'
import {
  activateHandler as commonActivateHandler,
  deactivateHandler as commonDeactivateHandler,
} from '../../userCommon/activationHandlers'
import { externalUserDetailsUrlProvider } from './common'

export const activateHandler = (services: Services) =>
  commonActivateHandler(
    services,
    ({ externalUserService }, token, userId) => externalUserService.enableUser(token, userId),
    externalUserDetailsUrlProvider,
  )

export const deactivateHandler = (services: Services) =>
  commonDeactivateHandler(
    services,
    ({ externalUserService }, token, userId) => externalUserService.disableUser(token, userId),
    externalUserDetailsUrlProvider,
  )
