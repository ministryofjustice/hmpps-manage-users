const querystring = require('querystring')

const nomisUsersAndRolesFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)

  const userSearch = (context, { nameFilter, roleFilter, status, caseload, activeCaseload, pageSize = 20, page = 0 }) =>
    get(
      context,
      `/users?${querystring.stringify({
        nameFilter,
        accessRole: roleFilter,
        status,
        caseload,
        activeCaseload,
        size: pageSize,
        page,
      })}`,
    )
  return {
    userSearch,
  }
}

module.exports = { nomisUsersAndRolesFactory }
