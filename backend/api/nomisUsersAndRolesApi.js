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
  return {
    userSearch,
  }
}

module.exports = { nomisUsersAndRolesFactory }
