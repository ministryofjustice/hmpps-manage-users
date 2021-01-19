const { validateCreate } = require('./authUserValidation')
const { trimObjValues } = require('../utils')

const createUserFactory = (getAssignableGroupsApi, createUser, createUrl, searchUrl, manageUrl, maintainTitle) => {
  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createUserErrors', errors)
    req.flash('user', user)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
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
      maintainUrl: createUrl,
      ...user,
      groupDropdownValues,
      errors: req.flash('createUserErrors'),
    })
  }

  const post = async (req, res) => {
    const isGroupManager = Boolean(res.locals && res.locals.user && res.locals.user.groupManager)
    const user = trimObjValues(req.body)

    const errors = validateCreate(user, isGroupManager)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        await createUser(res.locals, user)

        req.session.searchResultsUrl = `${searchUrl}/results?user=${user.email}`
        res.redirect(`${manageUrl}/${user.email}/details`)
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { emailError: error, error_description: errorDescription, field } = err.response.body
          const description =
            error === 'email.domain' ? 'The email domain is not allowed.  Enter a work email address' : errorDescription

          const errorDetails = [{ href: `#${field}`, text: description }]
          stashStateAndRedirectToIndex(req, res, errorDetails, [user])
        } else if (err.status === 409 && err.response && err.response.body) {
          // email already exists
          const emailError = [{ href: '#email', text: 'Email already exists' }]
          stashStateAndRedirectToIndex(req, res, emailError, [user])
        } else {
          throw err
        }
      }
    }
  }

  return { index, post }
}

module.exports = {
  createUserFactory,
}
