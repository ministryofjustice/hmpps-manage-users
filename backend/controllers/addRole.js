const selectRolesFactory = (getUserRolesAndMessage, saveRoles, searchUrl, manageUrl) => {
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

    const feedbackSource = `${req.get('host')}/select-roles`

    res.render('addRole.njk', {
      staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      roleDropdownValues,
      message: bannerMessage.message,
      feedbackUrl: `https://eu.surveymonkey.com/r/66HQSVJ?source=${feedbackSource}`,
      errors: req.flash('addRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const { userId } = req.params
    const { roles } = req.body
    const staffUrl = `${manageUrl}/${userId}/details`

    if (!roles) {
      const errors = [{ href: '#roles', text: 'Select at least one role' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      const roleArray = Array.isArray(roles) ? roles : [roles]
      await saveRoles(res.locals, userId, roleArray)
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectRolesFactory,
}
