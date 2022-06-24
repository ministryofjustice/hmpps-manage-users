const userDetailsFactory = (
  getUserRolesAndGroupsApi,
  removeRoleApi,
  removeGroupApi,
  enableUserApi,
  disableUserApi,
  defaultSearchUrl,
  manageUrl,
  defaultSearchTitle,
  showExtraUserDetails,
  canAutoEnableDisableUser,
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}`
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const hasMaintainDpsUsersAdmin = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)
    const hasManageDPSUserAccount = Boolean(res.locals && res.locals.user && res.locals.user.manageDPSUserAccount)

    const searchTitle = req.session.searchTitle ? req.session.searchTitle : defaultSearchTitle
    const searchUrl = req.session.searchUrl ? req.session.searchUrl : defaultSearchUrl
    const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : searchUrl

    const [user, roles, groups] = await getUserRolesAndGroupsApi(
      res.locals,
      userId,
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
      canAutoEnableDisableUser: Boolean(canAutoEnableDisableUser),
      showEnableDisable: Boolean(canAutoEnableDisableUser || hasManageDPSUserAccount),
      showGroups: Boolean(removeGroupApi),
      showCaseloads: Boolean(user.activeCaseload),
      showExtraUserDetails,
      showUsername: user.email !== user.username.toLowerCase(),
      displayEmailChangeInProgress: !user.verified && user.emailToVerify && user.emailToVerify !== user.email,
    })
  }

  const removeRole = async (req, res) => {
    const { userId, role } = req.params
    const staffUrl = `${manageUrl}/${userId}`

    try {
      await removeRoleApi(res.locals, userId, role)
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
    const { userId, group } = req.params
    const staffUrl = `${manageUrl}/${userId}`

    try {
      await removeGroupApi(res.locals, userId, group)
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
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}`

    await enableUserApi(res.locals, userId)
    res.redirect(`${staffUrl}/details`)
  }

  const disableUser = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}`

    await disableUserApi(res.locals, userId)
    res.redirect(`${staffUrl}/details`)
  }

  return { index, removeRole, removeGroup, enableUser, disableUser }
}

module.exports = {
  userDetailsFactory,
}
