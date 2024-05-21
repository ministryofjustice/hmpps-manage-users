const querystring = require('querystring')

const nomisUsersAndRolesFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)

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

  return {
    userSearch,
    downloadUserSearch,
    downloadLsaSearch,
  }
}

module.exports = { nomisUsersAndRolesFactory }
