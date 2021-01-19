const { validateChangeEmail } = require('./authUserValidation')
const { trimObjValues } = require('../utils')

function mapDescription(error, errorDescription) {
  switch (error) {
    case 'email.domain':
      return 'The email domain is not allowed.  Enter a work email address'
    case 'email.duplicate':
      return 'This email address is already assigned to a different user'
    default:
      return errorDescription
  }
}

const changeEmailFactory = (getUserApi, changeEmail, searchUrl, manageUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, email) => {
    req.flash('changeEmailErrors', errors)
    req.flash('changeEmail', email)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    const user = await getUserApi(res.locals, username)
    const flashEmail = req.flash('changeEmail')
    const email = flashEmail != null && flashEmail.length > 0 ? flashEmail[0] : user.email

    res.render('changeEmail.njk', {
      staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      currentEmail: email,
      errors: req.flash('changeEmailErrors'),
    })
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { email } = trimObjValues(req.body)
    const staffUrl = `${manageUrl}/${username}`
    try {
      const errors = validateChangeEmail(email)

      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [email])
      } else {
        await changeEmail(res.locals, username, email)
        res.redirect(`${staffUrl}/details`)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error, error_description: errorDescription } = err.response.body
        const description = mapDescription(error, errorDescription)

        const errors = [{ href: '#email', text: description }]
        stashStateAndRedirectToIndex(req, res, errors, [email])
      } else {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  changeEmailFactory,
}
