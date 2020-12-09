const { serviceUnavailableMessage } = require('../common-messages')

const selectRolesFactory = (getUserAndRoles, saveRoles, reactUrl, manageUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addRoleErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`
    const hasAdminRole = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)

    try {
      const [user, assignableRoles] = await getUserAndRoles(res.locals, username, hasAdminRole)
      const roleDropdownValues = assignableRoles.map((r) => ({
        text: r.roleName,
        value: r.roleCode,
      }))

      res.render('addRole.njk', {
        maintainTitle,
        maintainUrl: reactUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        roleDropdownValues,
        errors: req.flash('addRoleErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { roles } = req.body
    const staffUrl = `${manageUrl}/${username}`

    try {
      if (!roles) {
        const errors = [{ href: '#roles', text: 'Select at least one role' }]
        stashStateAndRedirectToIndex(req, res, errors)
      } else {
        const roleArray = Array.isArray(roles) ? roles : [roles]
        await saveRoles(res.locals, username, roleArray)
        res.redirect(staffUrl)
      }
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: `${staffUrl}/select-roles` })
    }
  }

  return { index, post }
}

module.exports = {
  selectRolesFactory,
}
