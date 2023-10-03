const { AuditService } = require('../services/auditService')

const selectRolesFactory = (getUserRolesAndMessage, saveRoles, manageUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addRoleErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}/details`
    const hasAdminRole = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)

    const [user, assignableRoles, bannerMessage] = await getUserRolesAndMessage(res.locals, userId, hasAdminRole)

    const roleDropdownValues = assignableRoles.map((r) => ({
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
    const auditService = new AuditService()
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
      await auditService.addRoleToUser({
        adminId: username,
        userId,
        roles: roleArray,
        logErrors: true,
      })
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectRolesFactory,
}
