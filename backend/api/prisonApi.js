const querystring = require('querystring')
const config = require('../config')
const contextProperties = require('../contextProperties')

const encodeQueryString = (input) => encodeURIComponent(input)

const prisonApiFactory = (client) => {
  const processResponse = (context) => (response) => {
    contextProperties.setResponsePagination(context, response.headers)
    return response.body
  }

  const get = (context, url, resultsLimit) => client.get(context, url, resultsLimit).then(processResponse(context))
  const post = (context, url, data) => client.post(context, url, data).then(processResponse(context))
  const put = (context, url, data) => client.put(context, url, data).then(processResponse(context))
  const del = (context, url, data) => client.del(context, url, data).then(processResponse(context))

  const userCaseLoads = (context) => (context.authSource !== 'auth' ? get(context, '/api/users/me/caseLoads') : [])
  const getAgencyDetails = (context, caseloadId) => get(context, `/api/agencies/caseload/${caseloadId}`)
  const userSearch = (context, { nameFilter, roleFilter, status }) =>
    get(
      context,
      `/api/users/local-administrator/available?${querystring.stringify({
        nameFilter,
        accessRole: roleFilter,
        status,
      })}`,
    )
  const userSearchAdmin = (context, { nameFilter, roleFilter, status, caseload, activeCaseload }) =>
    get(
      context,
      `/api/users?${querystring.stringify({ nameFilter, accessRole: roleFilter, status, caseload, activeCaseload })}`,
    )
  const getRoles = (context) => get(context, '/api/access-roles')
  const getRolesAdmin = (context) => get(context, '/api/access-roles?includeAdmin=true')
  const contextUserRoles = (context, username, hasAdminRole) =>
    get(
      context,
      `/api/users/${username}/access-roles/caseload/${config.app.applicationCaseload}?includeAdmin=${hasAdminRole}`,
    )
  const removeRole = (context, username, roleCode) =>
    del(context, `/api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const addRole = (context, username, roleCode) =>
    put(context, `/api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const getUser = (context, username) => get(context, `/api/users/${username}`)
  const addUserRoles = (context, username, roles) => post(context, `/api/users/${username}/access-role`, roles)
  const assignableRoles = async (context, username, hasAdminRole) => {
    const [userRoles, allRoles] = await Promise.all([
      contextUserRoles(context, username, hasAdminRole),
      hasAdminRole ? getRolesAdmin(context) : getRoles(context),
    ])
    return allRoles.filter((r) => !userRoles.some((userRole) => userRole.roleCode === r.roleCode))
  }
  const getCaseloads = (context) =>
    get(context, '/api/agencies/type/INST?activeOnly=true&withAddresses=false&skipFormatLocation=false')

  return {
    userSearch,
    getRoles,
    getRolesAdmin,
    contextUserRoles,
    removeRole,
    addRole,
    addUserRoles,
    getUser,
    userSearchAdmin,
    getAgencyDetails,
    userCaseLoads,
    assignableRoles,
    getCaseloads,
  }
}

module.exports = { prisonApiFactory }
