/** @type {any} */
const axios = require('axios')
const querystring = require('querystring')
const logger = require('../log')
const errorStatusCode = require('../error-status-code')

const AuthClientErrorName = 'AuthClientError'
const AuthClientError = (message) => ({ name: AuthClientErrorName, message, stack: new Error().stack })

const apiClientCredentials = (clientId, clientSecret) => Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

/**
 * Return an oauthApi built using the supplied configuration.
 * @param client
 * @param {object} params
 * @param {string} params.clientId
 * @param {string} params.clientSecret
 * @param {string} params.url
 * @returns a configured oauthApi instance
 */
const oauthApiFactory = (client, { clientId, clientSecret, url }) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)
  const post = (context, path, body) => client.post(context, path, body).then((response) => response.body)

  const getUserEmail = async (context, { username }) => {
    try {
      return await get(context, `/api/user/${username}/email?unverified=true`)
    } catch (error) {
      if (error?.status === 404) return {}
      throw error
    }
  }
  const createUser = (context, user) => post(context, `/api/authuser/create`, user)

  const changeDpsEmail = (context, username, email) => post(context, `/api/prisonuser/${username}/email`, email)
  const syncDpsEmail = (context, username) => post(context, `/api/prisonuser/${username}/email/sync`)

  const oauthAxios = axios.create({
    baseURL: `${url}/oauth/token`,
    method: 'post',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${apiClientCredentials(clientId, clientSecret)}`,
    },
  })

  // eslint-disable-next-line camelcase
  const parseOauthTokens = ({ access_token, refresh_token }) => ({ access_token, refresh_token })

  const translateAuthClientError = (error) => {
    logger.info(`Sign in error description = ${error}`)

    if (error.includes('has expired')) return 'Your password has expired.'
    if (error.includes('is locked')) return 'Your user account is locked.'
    if (error.includes('No credentials')) return 'Missing credentials.'
    if (error.includes('to caseload NWEB'))
      return 'You are not enabled for this service, please contact admin to request access.'

    return 'The username or password you have entered is invalid.'
  }

  const makeTokenRequest = (data, msg) =>
    oauthAxios({ data })
      .then((response) => {
        logger.debug(
          `${msg} ${response.config.method} ${response.config.url} ${response.status} ${response.statusText}`,
        )
        return parseOauthTokens(response.data)
      })
      .catch((error) => {
        const status = errorStatusCode(error)
        const errorDesc = (error.response && error.response.data && error.response.data.error_description) || null

        if (parseInt(status, 10) < 500 && errorDesc !== null) {
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
  const refresh = (refreshToken) =>
    makeTokenRequest(querystring.stringify({ refresh_token: refreshToken, grant_type: 'refresh_token' }), 'refresh:')

  return {
    getUserEmail,
    createUser,
    refresh,
    // Expose the internals so they can be Monkey Patched for testing. Oo oo oo.
    oauthAxios,
    changeDpsEmail,
    syncDpsEmail,
  }
}

module.exports = { oauthApiFactory, AuthClientError, AuthClientErrorName, apiClientCredentials }
