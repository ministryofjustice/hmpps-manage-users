import { UserUrlProvider } from '../../userCommon/paramTypes'
import paths from '../../paths'

export const externalUserRootUrlProvider: UserUrlProvider = userId => paths.externalUser.manage.root({ userId })
export const externalUserDetailsUrlProvider: UserUrlProvider = userId => paths.externalUser.manage.details({ userId })
export const externalUserChangeEmailUrlProvider: UserUrlProvider = userId =>
  paths.externalUser.manage.changeEmail({ userId })
export const externalUserChangeEmailSuccessUrlProvider: UserUrlProvider = userId =>
  paths.externalUser.manage.changeEmailSuccess({ userId })
