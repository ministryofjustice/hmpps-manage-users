const config = require('../config')
const contextProperties = require('../contextProperties')

const encodeQueryString = input => encodeURIComponent(input)

const elite2ApiFactory = client => {
  const processResponse = context => response => {
    contextProperties.setResponsePagination(context, response.headers)
    return response.data
  }

  const get = (context, url, resultsLimit) => client.get(context, url, resultsLimit).then(processResponse(context))

  const put = (context, url, data) => client.put(context, url, data).then(processResponse(context))

  const del = (context, url, data) => client.del(context, url, data).then(processResponse(context))

  const getAgencyDetails = (context, caseloadId) => get(context, `api/agencies/caseload/${caseloadId}`)
  const userSearch = (context, { nameFilter, roleFilter }) =>
    get(
      context,
      `api/users/local-administrator/available?nameFilter=${encodeQueryString(nameFilter)}&accessRole=${roleFilter}`
    )
  const userSearchAdmin = (context, { nameFilter, roleFilter }) =>
    get(context, `api/users?nameFilter=${encodeQueryString(nameFilter)}&accessRole=${roleFilter}`)
  const getRoles = context => get(context, 'api/access-roles')
  const getRolesAdmin = context => get(context, 'api/access-roles?includeAdmin=true')
  const contextUserRoles = (context, username, hasAdminRole) =>
    get(
      context,
      `api/users/${username}/access-roles/caseload/${config.app.applicationCaseload}?includeAdmin=${hasAdminRole}`
    )
  const removeRole = (context, agencyId, username, roleCode) =>
    del(context, `api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const addRole = (context, agencyId, username, roleCode) =>
    put(context, `api/users/${username}/caseload/${config.app.applicationCaseload}/access-role/${roleCode}`)
  const getUser = (context, username) => get(context, `api/users/${username}`)

  return {
    userSearch,
    getRoles,
    getRolesAdmin,
    contextUserRoles,
    removeRole,
    addRole,
    getUser,
    userSearchAdmin,
    getAgencyDetails,
  }
}

module.exports = { elite2ApiFactory }
