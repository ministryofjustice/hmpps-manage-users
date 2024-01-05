import axios, { AxiosError, AxiosInstance } from 'axios'
import querystring from 'querystring'
import logger from '../log'
import errorStatusCode from '../error-status-code'

/** @type {any} */
export const AuthClientErrorName = 'AuthClientError'
export const AuthClientError = (message: string) => ({ name: AuthClientErrorName, message, stack: new Error().stack })

export const apiClientCredentials = (clientId: string, clientSecret: string) =>
  Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

export interface OAuthApi {
  refresh: (refreshToken: string) => Promise<{ access_token: string; refresh_token: string }>
  oauthAxios: AxiosInstance
}

export interface OAuthApiFactoryParams {
  apiClientId: string
  apiClientSecret: string
  url: string
}

/**
 * Return an oauthApi built using the supplied configuration.
 * @param {object} params
 * @returns a configured oauthApi instance
 */
export const oauthApiFactory = (
  params: OAuthApiFactoryParams,
): OAuthApi => {
  const oauthAxios: AxiosInstance = axios.create({
    baseURL: `${params.url}/oauth/token`,
    method: 'post',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${apiClientCredentials(params.apiClientId, params.apiClientSecret)}`,
    },
  })

  // eslint-disable-next-line camelcase
  const parseOauthTokens = ({ access_token, refresh_token }: { access_token: string; refresh_token: string }) => ({
    access_token,
    refresh_token,
  })

  const translateAuthClientError = (error: string) => {
    logger.info(`Sign in error description = ${error}`)

    if (error.includes('has expired')) return 'Your password has expired.'
    if (error.includes('is locked')) return 'Your user account is locked.'
    if (error.includes('No credentials')) return 'Missing credentials.'
    if (error.includes('to caseload NWEB'))
      return 'You are not enabled for this service, please contact admin to request access.'

    return 'The username or password you have entered is invalid.'
  }

  interface ErrorData {
    error_description?: string
  }

  const getErrorDescription = (error: AxiosError) =>
    ((error.response && error.response.data) as ErrorData)?.error_description || null

  const makeTokenRequest = (data: string, msg: string) =>
    oauthAxios({ data })
      .then((response) => {
        logger.debug(
          `${msg} ${response.config.method} ${response.config.url} ${response.status} ${response.statusText}`,
        )
        return parseOauthTokens(response.data)
      })
      .catch((error: AxiosError) => {
        const status = errorStatusCode(error)
        const errorDesc = getErrorDescription(error)

        if (status < 500 && errorDesc !== null) {
          logger.info(`${msg} ${error.config.method} ${error.config.url} ${status} ${errorDesc}`)

          throw AuthClientError(translateAuthClientError(errorDesc))
        }

        logger.error(`${msg} ${error.config.method} ${error.config.url} ${status} ${error.message}`)
        throw error
      })

  /**
   * Perform OAuth token refresh, returning the tokens to the caller. See scopedStore.run.
   * @returns A Promise that resolves when token refresh has succeeded and the OAuth tokens have been returned.
   */
  const refresh = (refreshToken: string) =>
    makeTokenRequest(querystring.stringify({ refresh_token: refreshToken, grant_type: 'refresh_token' }), 'refresh:')

  return {
    refresh,
    // Expose the internals so they can be Monkey Patched for testing. Oo oo oo.
    oauthAxios,
  }
}
