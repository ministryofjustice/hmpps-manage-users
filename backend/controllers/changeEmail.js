const { auditService } = require('hmpps-audit-client')
const { validateChangeEmail } = require('./externalUserValidation')
const { trimObjValues } = require('../utils/utils')

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

const changeEmailFactory = (getUserApi, changeEmail, manageUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, email) => {
    req.flash('changeEmailErrors', errors)
    req.flash('changeEmail', email)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}/details`

    const user = await getUserApi(res.locals, userId)
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
    const { userId } = req.params
    const { username } = req.session.userDetails
    const { email } = trimObjValues(req.body)
    try {
      const errors = validateChangeEmail(email)

      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [email])
      } else {
        await changeEmail(res.locals, userId, email)
        await auditService.sendAuditMessage({
          action: 'CHANGE_EMAIL_ADDRESS',
          who: username,
          subjectId: userId,
          subjectType: 'USER_ID',
          details: JSON.stringify({ email }),
        })
        const successUrl = `${manageUrl}/${userId}/change-email-success`
        req.flash('changeEmail', email)
        res.redirect(successUrl)
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

  const success = async (req, res) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}/details`

    const email = req.flash('changeEmail')
    const user = await getUserApi(res.locals, userId)
    const usernameChanged = user.username.includes('@')

    res.render('changeEmailSuccess.njk', { email, detailsLink: staffUrl, usernameChanged })
  }

  return { index, post, success }
}

module.exports = {
  changeEmailFactory,
}
