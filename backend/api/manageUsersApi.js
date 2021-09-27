const manageUsersApiFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)
  const put = (context, path, body) => client.put(context, path, body).then((response) => response.body)

  const getRoleDetails = (context, roleCode) => get(context, `/roles/${roleCode}`)

  const changeRoleName = (context, roleCode, roleName) => client.put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (context, role, roleDescription) =>
    put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (context, role, adminType) => put(context, `/roles/${role}/admintype`, adminType)

  return {
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
    changeRoleAdminType,
  }
}

module.exports = { manageUsersApiFactory }
