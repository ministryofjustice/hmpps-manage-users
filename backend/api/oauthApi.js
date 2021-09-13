/** @type {any} */
const axios = require('axios')
const querystring = require('querystring')
const logger = require('../log')
const errorStatusCode = require('../error-status-code')
const contextProperties = require('../contextProperties')

const AuthClientErrorName = 'AuthClientError'
const AuthClientError = (message) => ({ name: AuthClientErrorName, message, stack: new Error().stack })

const apiClientCredentials = (clientId, clientSecret) => Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

const processPageResponse = (context) => (response) => {
  if (response.body.pageable) {
    contextProperties.setPageable(context, response.body)
    return response.body.content
  }
  return response.body
}

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
  const put = (context, path, body) => client.put(context, path, body).then((response) => response.body)
  const post = (context, path, body) => client.post(context, path, body).then((response) => response.body)
  const del = (context, path) => client.del(context, path).then((response) => response.body)
  const currentUser = (context) => get(context, '/api/user/me')
  const currentRoles = (context) => get(context, '/api/user/me/roles')
  const getUserEmail = async (context, { username }) => {
    try {
      return await get(context, `/api/user/${username}/email?unverified=true`)
    } catch (error) {
      if (error?.status === 404) return {}
      throw error
    }
  }
  const userEmails = (context, usernames) => post(context, `/api/user/email`, usernames)
  const getUser = (context, { userId }) => get(context, `/api/authuser/id/${userId}`)
  const createUser = (context, user) => post(context, `/api/authuser/create`, user)
  const userRoles = (context, { userId }) => get(context, `/api/authuser/id/${userId}/roles`)
  const userGroups = (context, { userId }) => get(context, `/api/authuser/id/${userId}/groups?children=false`)
  const userSearch = (context, { nameFilter, role, group, status }, page, size) => {
    const groups = group ? [group] : null
    const roles = role ? [role] : null
    const query = querystring.stringify({
      name: nameFilter,
      groups,
      roles,
      status,
      page,
      size,
    })
    return client.get(context, `/api/authuser/search?${query}`).then(processPageResponse(context))
  }
  const addUserRoles = (context, { userId, roles }) => post(context, `/api/authuser/id/${userId}/roles`, roles)
  const removeUserRole = (context, { userId, role }) => del(context, `/api/authuser/id/${userId}/roles/${role}`)
  const addUserGroup = (context, { userId, group }) => put(context, `/api/authuser/id/${userId}/groups/${group}`)
  const removeUserGroup = (context, { userId, group }) => del(context, `/api/authuser/id/${userId}/groups/${group}`)
  const assignableGroups = (context) => get(context, '/api/authuser/me/assignable-groups')
  const searchableRoles = (context) => get(context, '/api/authuser/me/searchable-roles')
  const enableUser = (context, { userId }) => put(context, `/api/authuser/id/${userId}/enable`)
  const disableUser = (context, { userId }) => put(context, `/api/authuser/id/${userId}/disable`)
  const deactivateUser = (context, { userId, reason }) => put(context, `/api/authuser/id/${userId}/disable`, { reason })
  const assignableRoles = (context, { userId }) => get(context, `/api/authuser/id/${userId}/assignable-roles`)
  const amendUserEmail = (context, userId, email) => post(context, `/api/authuser/id/${userId}/email`, email)
  const groupDetails = (context, { group }) => get(context, `/api/groups/${group}`)
  const deleteGroup = (context, group) => del(context, `/api/groups/${group}`)
  const changeGroupName = (context, group, groupName) => put(context, `/api/groups/${group}`, groupName)
  const childGroupDetails = (context, { group }) => get(context, `/api/groups/child/${group}`)
  const changeChildGroupName = (context, group, groupName) => put(context, `/api/groups/child/${group}`, groupName)
  const createChildGroup = (context, group) => post(context, '/api/groups/child', group)
  const createGroup = (context, group) => post(context, '/api/groups', group)
  const deleteChildGroup = (context, group) => del(context, `/api/groups/child/${group}`)
  const changeDpsEmail = (context, username, email) => post(context, `/api/prisonuser/${username}/email`, email)
  const getAllRoles = (context, page, size) => {
    const query = querystring.stringify({
      page,
      size,
    })
    return client.get(context, `/api/roles?${query}`).then(processPageResponse(context))
  }
  const createRole = (context, role) => post(context, '/api/roles', role)
  const getRoleDetails = (context, role) => get(context, `/api/roles/${role}`)
  const changeRoleName = (context, role, roleName) => put(context, `/api/roles/${role}`, roleName)
  const changeRoleDescription = (context, role, roleDescription) =>
    put(context, `/api/roles/${role}/description`, roleDescription)

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
  const parseOauthTokens = ({ access_token, refresh_token }) => ({
    access_token,
    refresh_token,
  })

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
    currentUser,
    currentRoles,
    getUserEmail,
    userEmails,
    getUser,
    createUser,
    userSearch,
    userRoles,
    userGroups,
    addUserRoles,
    removeUserRole,
    addUserGroup,
    removeUserGroup,
    assignableRoles,
    refresh,
    // Expose the internals so they can be Monkey Patched for testing. Oo oo oo.
    oauthAxios,
    enableUser,
    disableUser,
    deactivateUser,
    amendUserEmail,
    assignableGroups,
    searchableRoles,
    groupDetails,
    deleteGroup,
    changeGroupName,
    childGroupDetails,
    changeChildGroupName,
    createChildGroup,
    createGroup,
    deleteChildGroup,
    changeDpsEmail,
    createRole,
    getAllRoles,
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
  }
}

module.exports = { oauthApiFactory, AuthClientError, AuthClientErrorName, apiClientCredentials }
