import { Services } from '../../../services'
import {
  activateHandler as commonActivateHandler,
  deactivateHandler as commonDeactivateHandler,
} from '../../userCommon/activationHandlers'
import { dpsUserDetailsUrlProvider } from './common'

export const activateHandler = (services: Services) =>
  commonActivateHandler(
    services,
    ({ dpsUserService }, token, userId) => dpsUserService.enableUser(token, userId),
    dpsUserDetailsUrlProvider,
  )

export const deactivateHandler = (services: Services) =>
  commonDeactivateHandler(
    services,
    ({ dpsUserService }, token, userId) => dpsUserService.disableUser(token, userId),
    dpsUserDetailsUrlProvider,
  )
