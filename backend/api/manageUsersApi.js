const manageUsersApiFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)

  const getRoleDetails = (context, roleCode) => get(context, `/roles/${roleCode}`)

  const changeRoleName = (context, roleCode, roleName) => client.put(context, `/roles/${roleCode}`, roleName)

  return {
    getRoleDetails,
    changeRoleName,
  }
}

module.exports = { manageUsersApiFactory }
