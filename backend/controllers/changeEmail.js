const { serviceUnavailableMessage } = require('../common-messages')
const { validateChangeEmail } = require('./authUserValidation')

const changeEmailFactory = (getUserApi, changeEmail, reactUrl, manageUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors, email) => {
    req.flash('changeEmailErrors', errors)
    req.flash('changeEmail', email)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      const user = await getUserApi(res.locals, username)
      const flashEmail = req.flash('changeEmail')
      const email = flashEmail != null && flashEmail.length > 0 ? flashEmail[0] : user.email

      res.render('changeEmail.njk', {
        maintainTitle,
        maintainUrl: reactUrl,
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
    const staffUrl = `${manageUrl}/${username}`
    const trimmedEmail = email ? email.trim() : email
    try {
      const errors = validateChangeEmail(trimmedEmail)

      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [trimmedEmail])
      } else {
        await changeEmail(res.locals, username, trimmedEmail)
        res.redirect(staffUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error, error_description: errorDescription } = err.response.body
        const description =
          error === 'email.domain' ? 'The email domain is not allowed.  Enter a work email address' : errorDescription

        const errors = [{ href: '#email', text: description }]
        stashStateAndRedirectToIndex(req, res, errors, [trimmedEmail])
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
