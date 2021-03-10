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
  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const hasMaintainDpsUsersAdmin = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)

    const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : `${searchUrl}/results`

    const [user, roles, groups, assignableGroups] = await getUserRolesAndGroupsApi(
      res.locals,
      username,
      hasMaintainDpsUsersAdmin,
    )
    let groupsMaintainGroupManager = []
    let groupsNotGroupManager = []

    if (removeGroupApi && !hasMaintainAuthUsers) {
      const userGroupsCodes = new Set(groups.map((g) => g.groupCode))
      groupsMaintainGroupManager = assignableGroups.filter((g) => userGroupsCodes.has(g.groupCode))

      const assignableGroupsCodes = new Set(assignableGroups.map((g) => g.groupCode))
      groupsNotGroupManager = groups.filter((g) => !assignableGroupsCodes.has(g.groupCode))
    }

    res.render('userDetails.njk', {
      searchTitle,
      searchResultsUrl,
      searchUrl,
      staff: { ...user, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      roles,
      groups,
      groupsMaintainGroupManager,
      groupsNotGroupManager,
      hasMaintainAuthUsers,
      errors: req.flash('errors'),
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
