import { UserUrlProvider } from '../../userCommon/paramTypes'
import paths from '../../paths'

export const dpsUserRootUrlProvider: UserUrlProvider = userId => paths.dpsUser.manage.root({ userId })
export const dpsUserDetailsUrlProvider: UserUrlProvider = userId => paths.dpsUser.manage.details({ userId })
export const dpsUserChangeEmailUrlProvider: UserUrlProvider = userId => paths.dpsUser.manage.changeEmail({ userId })
export const dpsUserChangeEmailSuccessUrlProvider: UserUrlProvider = userId =>
  paths.dpsUser.manage.changeEmailSuccess({ userId })
