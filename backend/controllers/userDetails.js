const userDetailsFactory = (
  getUserRolesAndGroupsApi,
  removeRoleApi,
  removeGroupApi,
  enableUserApi,
  disableUserApi,
  searchUrl,
  manageUrl,
  searchTitle,
  showExtraUserDetails,
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const hasMaintainDpsUsersAdmin = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)

    const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : `${searchUrl}/results`

    const [user, roles, groups] = await getUserRolesAndGroupsApi(
      res.locals,
      username,
      hasMaintainDpsUsersAdmin,
      hasMaintainAuthUsers,
    )

    res.render('userDetails.njk', {
      searchTitle,
      searchResultsUrl,
      searchUrl,
      staff: { ...user, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      roles,
      groups,
      hasMaintainDpsUsersAdmin,
      errors: req.flash('deleteGroupErrors'),
      showEnableDisable: Boolean(enableUserApi && disableUserApi),
      showGroups: Boolean(removeGroupApi),
      showExtraUserDetails,
      showUsername: user.email !== user.username.toLowerCase(),
    })
  }

  const removeRole = async (req, res) => {
    const { username, role } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await removeRoleApi(res.locals, username, role)
      res.redirect(`${staffUrl}/details`)
    } catch (error) {
      if (error.status === 400) {
        // role already removed from group
        res.redirect(req.originalUrl)
      } else {
        throw error
      }
    }
  }

  const removeGroup = async (req, res) => {
    const { username, group } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await removeGroupApi(res.locals, username, group)
      res.redirect(`${staffUrl}/details`)
    } catch (error) {
      if (error.status === 400) {
        // user already removed from group
        res.redirect(req.originalUrl)
      } else if (error.status === 403 && error.response && error.response.body) {
        const groupError = [
          {
            href: '#groupCode',
            text: 'You are not allowed to remove the last group from this user, please deactivate their account instead',
          },
        ]
        stashStateAndRedirectToIndex(req, res, groupError, [group], `${staffUrl}/details`)
      } else {
        throw error
      }
    }
  }

  const enableUser = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    await enableUserApi(res.locals, username)
    res.redirect(`${staffUrl}/details`)
  }

  const disableUser = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    await disableUserApi(res.locals, username)
    res.redirect(`${staffUrl}/details`)
  }

  return { index, removeRole, removeGroup, enableUser, disableUser }
}

module.exports = {
  userDetailsFactory,
}
