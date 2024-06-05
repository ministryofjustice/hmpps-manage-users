const { auditService, USER_ID_SUBJECT_TYPE } = require('@ministryofjustice/hmpps-audit-client')

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
      await saveRoles(res.locals, userId, roleArray)
      await auditService.sendAuditMessage({
        action: 'ADD_USER_ROLES',
        who: username,
        subjectId: userId,
        subjectType: USER_ID_SUBJECT_TYPE,
        details: JSON.stringify({ roles: roleArray }),
        service: 'hmpps-manage-users',
      })
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectRolesFactory,
}
