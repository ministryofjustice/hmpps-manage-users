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

  const getRoles = (context, hasAdminRole) => get(context, `/roles?admin-roles=${hasAdminRole}`)
  const getCaseloads = (context) => get(context, '/reference-data/caseloads')

  const currentUserCaseloads = (context, username) =>
    context.authSource !== 'auth' ? getUserCaseloads(context, username) : []

  const getUser = (context, username) => get(context, `/users/${username}`)
  const enableUser = (context, { username }) => put(context, `/users/${username}/unlock-user`)
  const disableUser = (context, { username }) => put(context, `/users/${username}/lock-user`)
  const addRole = (context, username, roleCode) => put(context, `/users/${username}/roles/${roleCode}`)
  const addUserRoles = (context, username, roles) => post(context, `/users/${username}/roles`, roles)
  const removeRole = (context, username, roleCode) => del(context, `/users/${username}/roles/${roleCode}`)
  const getUserCaseloads = (context, username) => get(context, `/users/${username}/caseloads`)
  const removeUserCaseload = (context, username, caseloadId) =>
    del(context, `/users/${username}/caseloads/${caseloadId}`)

  return {
    userSearch,
    downloadUserSearch,
    getRoles,
    getCaseloads,
    currentUserCaseloads,
    getUser,
    enableUser,
    disableUser,
    addRole,
    addUserRoles,
    removeRole,
    getUserCaseloads,
    removeUserCaseload,
  }
}

module.exports = { nomisUsersAndRolesFactory }
