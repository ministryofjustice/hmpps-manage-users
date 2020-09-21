const hasRole = (userRoles, roleCode) => userRoles.some((role) => role.roleCode === roleCode)

module.exports = ({ oauthApi }) => async (req, res, next) => {
  if (!req.xhr) {
    if (!req.session.userDetails) {
      req.session.userDetails = await oauthApi.currentUser(res.locals)
      const roles = await oauthApi.currentRoles(res.locals)
      req.session.userRoles = {
        maintainAccess: hasRole(roles, 'MAINTAIN_ACCESS_ROLES'),
        maintainAccessAdmin: hasRole(roles, 'MAINTAIN_ACCESS_ROLES_ADMIN'),
        maintainAuthUsers: hasRole(roles, 'MAINTAIN_OAUTH_USERS'),
        groupManager: hasRole(roles, 'AUTH_GROUP_MANAGER'),
      }
    }

    res.locals.user = {
      ...res.locals.user,
      displayName: req.session.userDetails.name,
    }
  }
  next()
}
