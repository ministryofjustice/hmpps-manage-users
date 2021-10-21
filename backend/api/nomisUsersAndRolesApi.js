const querystring = require('querystring')

const nomisUsersAndRolesFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)

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
  const getCaseloads = (context) => get(context, '/reference-data/caseloads')

  return {
    userSearch,
    getCaseloads,
  }
}

module.exports = { nomisUsersAndRolesFactory }
