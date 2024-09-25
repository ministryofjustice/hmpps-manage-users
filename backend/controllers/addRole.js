const { auditWithSubject, ManageUsersEvent, ManageUsersSubjectType } = require('../audit')

const selectRolesFactory = (getUserRolesAndMessage, saveRoles, manageUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addRoleErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}/details`
    const hasAdminRole = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)
    const isOauthAdmin = Boolean(res.locals?.user?.maintainOAuthAdmin)

    const [user, assignableRoles, bannerMessage] = await getUserRolesAndMessage(res.locals, userId, hasAdminRole)

    const allowedAssignableRoles = isOauthAdmin
      ? assignableRoles
      : assignableRoles.filter((role) => role.roleCode !== 'OAUTH_ADMIN')

    const roleDropdownValues = allowedAssignableRoles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
      ...(r.roleDescription && {
        hint: {
          text: r.roleDescription,
        },
      }),
    }))

    const audit = auditWithSubject(req.session.userDetails, userId, ManageUsersSubjectType.USER_ID)
    await audit(ManageUsersEvent.VIEW_USER_ROLES_ATTEMPT)

    res.render('addRole.njk', {
      staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      roleDropdownValues,
      message: bannerMessage.message,
      errors: req.flash('addRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const { userId } = req.params
    const { roles } = req.body
    const { username } = req.session.userDetails
    const staffUrl = `${manageUrl}/${userId}/details`

    if (!roles) {
      const errors = [{ href: '#roles', text: 'Select at least one role' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      const roleArray = Array.isArray(roles) ? roles : [roles]
      const sendAudit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID, { roles: roleArray })
      await sendAudit(ManageUsersEvent.ADD_USER_ROLES_ATTEMPT)

      try {
        await saveRoles(res.locals, userId, roleArray)
      } catch {
        await sendAudit(ManageUsersEvent.ADD_USER_ROLES_FAILURE)
      }
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectRolesFactory,
}
