const querystring = require('querystring')

const nomisUsersAndRolesFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)
  const post = (context, path, data) => client.post(context, path, data).then((response) => response.body)
  const put = (context, path, data) => client.put(context, path, data).then((response) => response.body)
  const del = (context, path, data) => client.del(context, path, data).then((response) => response.body)

  const userSearch = (context, { nameFilter, accessRoles, status, caseload, activeCaseload, size = 20, page = 0 }) =>
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
      })}`,
    )

  const downloadUserSearch = (context, { nameFilter, accessRoles, status, caseload, activeCaseload }) =>
    get(
      context,
      `/users/download?${querystring.stringify({
        nameFilter,
        accessRoles,
        status,
        caseload,
        activeCaseload,
      })}`,
    )

  const getCaseloads = (context) => get(context, '/reference-data/caseloads')

  const removeRole = (context, username, roleCode) => del(context, `/users/${username}/roles/${roleCode}`)
  const addRole = (context, username, roleCode) => put(context, `/users/${username}/roles/${roleCode}`)
  const addUserRoles = (context, username, roles) => post(context, `/users/${username}/roles`, roles)
  const createAdminUser = (context, user) => post(context, `/users/admin-account`, user)
  const createGeneralUser = (context, user) => post(context, `/users/general-account`, user)
  const createLocalAdminUser = (context, user) => post(context, `/users/local-admin-account`, user)
  const getUser = (context, username) => get(context, `/users/${username}`)
  const getUserCaseloads = (context, username) => get(context, `/users/${username}/caseloads`)
  const userCaseLoads = (context, username) =>
    context.authSource !== 'auth' ? getUserCaseloads(context, username) : []
  const getRoles = (context, hasAdminRole) => get(context, `/roles?admin-roles=${hasAdminRole}`)

  return {
    getRoles,
    createAdminUser,
    createLocalAdminUser,
    createGeneralUser,
    getUser,
    userSearch,
    getCaseloads,
    removeRole,
    addRole,
    addUserRoles,
    userCaseLoads,
    downloadUserSearch,
  }
}

module.exports = { nomisUsersAndRolesFactory }
