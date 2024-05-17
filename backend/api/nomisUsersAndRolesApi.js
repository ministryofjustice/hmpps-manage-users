const querystring = require('querystring')

const nomisUsersAndRolesFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)
  const post = (context, path, data) => client.post(context, path, data).then((response) => response.body)
  const put = (context, path, data) => client.put(context, path, data).then((response) => response.body)
  const del = (context, path) => client.del(context, path).then((response) => response.body)

  const userSearch = (
    context,
    { nameFilter, accessRoles, status, caseload, activeCaseload, size = 20, page = 0, inclusiveRoles, showOnlyLSAs },
  ) =>
    get(
      context,
      `/users?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        size,
        page,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const downloadUserSearch = (
    context,
    { nameFilter, accessRoles, status, caseload, activeCaseload, inclusiveRoles, showOnlyLSAs },
  ) =>
    get(
      context,
      `/users/download?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const downloadLsaSearch = (
    context,
    { nameFilter, accessRoles, status, caseload, activeCaseload, inclusiveRoles, showOnlyLSAs },
  ) =>
    get(
      context,
      `/users/download/admins?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
        inclusiveRoles,
        showOnlyLSAs,
      })}`,
    )

  const getRoles = (context, hasAdminRole) => get(context, `/roles?admin-roles=${hasAdminRole}`)
  const addUserRole = (context, username, roleCode) => put(context, `/users/${username}/roles/${roleCode}`)
  const addUserRoles = (context, username, roles) => post(context, `/users/${username}/roles`, roles)
  const removeUserRole = (context, username, roleCode) => del(context, `/users/${username}/roles/${roleCode}`)

  return {
    userSearch,
    downloadUserSearch,
    downloadLsaSearch,
    getRoles,
    addUserRole,
    addUserRoles,
    removeUserRole,
  }
}

module.exports = { nomisUsersAndRolesFactory }
