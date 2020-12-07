const { serviceUnavailableMessage } = require('../common-messages')
const { validateCreate } = require('./authUserValidation')

const createUserFactory = (
  getAssignableGroupsApi,
  createUser,
  reactUrl,
  createUrl,
  manageUrl,
  maintainTitle,
  logError
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createUserErrors', errors)
    req.flash('user', user)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    try {
      const assignableGroups = await getAssignableGroupsApi(res.locals)
      const flashUser = req.flash('user')
      const user = flashUser != null && flashUser.length > 0 ? flashUser[0] : ''
      const groupDropdownValues = assignableGroups.map((g) => ({
        text: g.groupName,
        value: g.groupCode,
        selected: g.groupCode === user.groupCode,
      }))

      res.render('createUser.njk', {
        maintainTitle,
        maintainUrl: reactUrl,
        ...user,
        groupDropdownValues: [{ text: '', value: '' }].concat(groupDropdownValues),
        errors: req.flash('createUserErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: createUrl })
    }
  }

  const post = async (req, res) => {
    const isGroupManager = Boolean(res.locals && res.locals.user && res.locals.user.groupManager)
    const user = req.body
    const errors = validateCreate(user, isGroupManager)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        await createUser(res.locals, user)
        res.redirect(`${manageUrl}/${user.username}`)
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { emailError: error, error_description: errorDescription, field } = err.response.body
          const description =
            error === 'email.domain' ? 'The email domain is not allowed.  Enter a work email address' : errorDescription

          const errorDetails = [{ href: `#${field}`, text: description }]
          stashStateAndRedirectToIndex(req, res, errorDetails, [user])
        } else if (err.status === 409 && err.response && err.response.body) {
          // username already exists
          const usernameError = [{ href: '#username', text: 'Username already exists' }]
          stashStateAndRedirectToIndex(req, res, usernameError, [user])
        } else {
          logError(req.originalUrl, err, serviceUnavailableMessage)
          res.render('error.njk', { url: createUrl })
        }
      }
    }
  }

  return { index, post }
}

module.exports = {
  createUserFactory,
}