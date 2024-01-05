import { default as config } from '../config'
import log from '../../logger'
import { OAuthEnabledClient } from './oauthEnabledClient' // Assuming this is the correct import for OAuthEnabledClient

/** @type {any} */
interface TokenVerificationApi {
  verifyToken: (context: any) => Promise<boolean>
}

export const tokenVerificationApiFactory = (client: OAuthEnabledClient): TokenVerificationApi => {
  const verifyToken = (context: any) => {
    if (!config.apis.tokenVerification.enabled) {
      log.debug('Token verification disabled, returning token is valid')
      return Promise.resolve(true)
    }
    return client
      .post(context, `/token/verify`)
      .then((response) => Boolean(response.body && response.body.active))
      .catch(() => false)
  }

  return { verifyToken }
}
