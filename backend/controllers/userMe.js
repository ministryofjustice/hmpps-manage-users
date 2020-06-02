const userMeFactory = (oauthApi, elite2Api) => {
  const userMeService = async (req, res) => {
    const context = res.locals
    const user = await oauthApi.currentUser(context)
    const caseloads = await elite2Api.userCaseLoads(context)
    const activeCaseLoad = caseloads.find(cl => cl.currentlyActive)
    const activeCaseLoadId = activeCaseLoad ? activeCaseLoad.caseLoadId : null

    const roles = await oauthApi.currentRoles(context)

    const hasMaintainAccessRolesRole = roles.some(role => role.roleCode === 'MAINTAIN_ACCESS_ROLES')
    const hasMaintainAccessRolesAdminRole = roles.some(role => role.roleCode === 'MAINTAIN_ACCESS_ROLES_ADMIN')
    const hasMaintainAuthUsersRole = roles.some(role => role.roleCode === 'MAINTAIN_OAUTH_USERS')
    const hasGroupManagerRole = roles.some(role => role.roleCode === 'AUTH_GROUP_MANAGER')

    const response = {
      ...user,
      activeCaseLoadId,
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
