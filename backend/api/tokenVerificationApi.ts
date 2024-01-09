import config from '../config'
import log from '../log'
import { OAuthEnabledClient } from './oauthEnabledClient'
import { Context } from '../interfaces/context'

export interface TokenVerificationApi {
  verifyToken: (context: Context) => Promise<boolean>
}

export const tokenVerificationApiFactory = (client: OAuthEnabledClient): TokenVerificationApi => {
  const verifyToken = (context: Context) => {
    if (!config.apis.tokenVerification.enabled) {
      log.debug('Token verification disabled, returning token is valid')
      return true
    }
    return client
      .post(context, `/token/verify`)
      .then((response) => Boolean(response.body && response.body.active))
      .catch(() => false)
  }

  return <TokenVerificationApi>{ verifyToken }
}
