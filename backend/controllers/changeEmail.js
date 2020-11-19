const { serviceUnavailableMessage } = require('../common-messages')

const changeEmailFactory = (getUser, changeEmail, maintainUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors, email) => {
    req.flash('changeEmailErrors', errors)
    req.flash('changeEmail', email)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${maintainUrl}/${username}`

    try {
      const user = await getUser(res.locals, username)
      const flashEmail = req.flash('changeEmail')
      const email = flashEmail.length > 0 ? flashEmail[0] : user.email

      res.render('changeEmail.njk', {
        maintainTitle,
        maintainUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        currentEmail: email,
        errors: req.flash('changeEmailErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { email } = req.body
    const staffUrl = `${maintainUrl}/${username}`

    try {
      if (!email) {
        const errors = [{ href: '#email', text: 'Enter an email address' }]
        stashStateAndRedirectToIndex(req, res, errors, [email])
      } else {
        await changeEmail(res.locals, username, email)
        res.redirect(staffUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error_description: errorDescription } = err.response.body

        const errors = [{ href: '#email', text: errorDescription }]
        stashStateAndRedirectToIndex(req, res, errors, email)
      } else {
        logError(req.originalUrl, err, serviceUnavailableMessage)
        res.render('error.njk', { url: `${staffUrl}/change-email` })
      }
    }
  }

  return { index, post }
}

module.exports = {
  changeEmailFactory,
}
