const { forenameToInitial } = require('../utils/utils')
const config = require('../config').default

const hasRole = (userRoles, roleCode) => userRoles.some((role) => role.roleCode === roleCode)
const hasAnyRole = (userRoles, roleCodes) => roleCodes.some((role) => hasRole(userRoles, role))

module.exports =
  ({ manageUsersApi }) =>
  async (req, res, next) => {
    if (!req.session.userDetails) {
      req.session.userDetails = await manageUsersApi.currentUser(res.locals)
      req.session.allCaseloads = await manageUsersApi.currentUserCaseloads(res.locals, req.session.userDetails.username)

      const roles = await manageUsersApi.currentRoles(res.locals)
      req.session.userRoles = {
        maintainAccess: hasRole(roles, 'MAINTAIN_ACCESS_ROLES'),
        maintainAccessAdmin: hasRole(roles, 'MAINTAIN_ACCESS_ROLES_ADMIN'),
        maintainAuthUsers: hasRole(roles, 'MAINTAIN_OAUTH_USERS'),
        maintainOAuthAdmin: hasRole(roles, 'OAUTH_ADMIN'),
        groupManager: hasRole(roles, 'AUTH_GROUP_MANAGER'),
        maintainRoles: hasRole(roles, 'ROLES_ADMIN'),
        viewAdministrableUserRoles: hasAnyRole(roles, ['ROLES_ADMIN', 'VIEW_ADMINISTRABLE_USER_ROLES']),
        createDPSUsers: hasRole(roles, 'CREATE_USER'),
        manageDPSUserAccount: hasRole(roles, 'MANAGE_NOMIS_USER_ACCOUNT'),
        manageEmailDomains: hasRole(roles, 'MAINTAIN_EMAIL_DOMAINS'),
        manageUserAllowList: hasRole(roles, 'MANAGE_USER_ALLOW_LIST'),
        crsGroupUsersDownload: hasRole(roles, 'CONTRACT_MANAGER_VIEW_GROUP'),
      }
    }

    const { activeCaseload, caseloads } = req.session.allCaseloads
    const { name } = req.session.userDetails
    const returnUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    const clientID = config.apis.hmppsAuth.apiClientId

    res.locals.user = {
      returnUrl,
      clientID,
      ...res.locals.user,
      allCaseloads: caseloads,
      displayName: forenameToInitial(name),
      activeCaseLoad: activeCaseload,
      ...req.session.userRoles,
    }
    next()
  }
