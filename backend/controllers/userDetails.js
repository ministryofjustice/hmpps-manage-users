const { serviceUnavailableMessage } = require('../common-messages')

const userDetailsFactory = (
  getUserRolesAndGroupsApi,
  removeRoleApi,
  removeGroupApi,
  enableUserApi,
  disableUserApi,
  reactUrl,
  manageUrl,
  maintainTitle,
  logError
) => {
  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      const [user, roles, groups] = await getUserRolesAndGroupsApi(res.locals, username)
      res.render('userDetails.njk', {
        maintainTitle,
        maintainUrl: reactUrl,
        staff: { ...user, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        roles,
        groups,
        errors: req.flash('errors'),
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
