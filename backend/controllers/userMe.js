const userMeFactory = oauthApi => {
  const userMeService = async (req, res) => {
    const context = res.locals
    const user = await oauthApi.currentUser(context)
    const roles = await oauthApi.currentRoles(context)

    const hasMaintainAccessRolesRole = roles.some(role => role.roleCode === 'MAINTAIN_ACCESS_ROLES')
    const hasMaintainAccessRolesAdminRole = roles.some(role => role.roleCode === 'MAINTAIN_ACCESS_ROLES_ADMIN')
    const hasMaintainAuthUsersRole = roles.some(role => role.roleCode === 'MAINTAIN_OAUTH_USERS')
    const hasGroupManagerRole = roles.some(role => role.roleCode === 'AUTH_GROUP_MANAGER')

    const response = {
      ...user,
      maintainAccess: hasMaintainAccessRolesRole,
      maintainAccessAdmin: hasMaintainAccessRolesAdminRole,
      maintainAuthUsers: hasMaintainAuthUsersRole,
      groupManager: hasGroupManagerRole,
    }
    res.json(response)
  }

  return { userMeService }
}

module.exports = { userMeFactory }
