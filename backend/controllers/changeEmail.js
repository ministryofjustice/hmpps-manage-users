const { serviceUnavailableMessage } = require('../common-messages')

const changeEmailFactory = (getUser, changeEmail, maintainUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('changeEmailErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${maintainUrl}/${username}`

    try {
      const user = await getUser(res.locals, username)

      res.render('changeEmail.njk', {
        maintainTitle,
        maintainUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        currentEmail: user.email,
        errors: req.flash('changeEmailErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { roles } = req.body
    const staffUrl = `${maintainUrl}/${username}`

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
  changeEmailFactory,
}
