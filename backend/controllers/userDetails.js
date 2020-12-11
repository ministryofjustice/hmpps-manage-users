const { serviceUnavailableMessage } = require('../common-messages')

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
  logError
) => {
  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const hasMaintainDpsUsersAdmin = Boolean(res.locals && res.locals.user && res.locals.user.maintainAccessAdmin)

    const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : `${searchUrl}/results`

    try {
      const [user, roles, groups] = await getUserRolesAndGroupsApi(res.locals, username, hasMaintainDpsUsersAdmin)
      res.render('userDetails.njk', {
        searchTitle,
        searchResultsUrl,
        searchUrl,
        staff: { ...user, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        roles,
        groups,
        hasMaintainAuthUsers,
        errors: req.flash('errors'),
        showEnableDisable: Boolean(enableUserApi && disableUserApi),
        showGroups: Boolean(removeGroupApi),
        showExtraUserDetails,
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const removeRole = async (req, res) => {
    const { username, role } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await removeRoleApi(res.locals, username, role)
      res.redirect(staffUrl)
    } catch (error) {
      if (error.status === 400) {
        // role already removed from group
        res.redirect(req.originalUrl)
      } else {
        logError(req.originalUrl, error, serviceUnavailableMessage)
        res.render('error.njk', { url: staffUrl })
      }
    }
  }

  const removeGroup = async (req, res) => {
    const { username, group } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await removeGroupApi(res.locals, username, group)
      res.redirect(staffUrl)
    } catch (error) {
      if (error.status === 400) {
        // user already removed from group
        res.redirect(req.originalUrl)
      } else {
        logError(req.originalUrl, error, serviceUnavailableMessage)
        res.render('error.njk', { url: staffUrl })
      }
    }
  }

  const enableUser = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await enableUserApi(res.locals, username)
      res.redirect(staffUrl)
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const disableUser = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      await disableUserApi(res.locals, username)
      res.redirect(staffUrl)
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  return { index, removeRole, removeGroup, enableUser, disableUser }
}

module.exports = {
  userDetailsFactory,
}
