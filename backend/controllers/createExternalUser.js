const { validateCreate } = require('./externalUserValidation')
const { trimObjValues } = require('../utils/utils')
const { audit, ManageUsersEvent } = require('../audit')
const cleanUpRedirect = require('../utils/urlUtils').default

const createExternalUserFactory = (
  getAssignableGroupsApi,
  createExternalUser,
  createUrl,
  searchUrl,
  manageUrl,
  maintainTitle,
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createExternalUserErrors', errors)
    req.flash('user', user)
    res.redirect(cleanUpRedirect(req.originalUrl))
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

    res.render('createExternalUser.njk', {
      maintainTitle,
      maintainUrl: createUrl,
      ...user,
      groupDropdownValues,
      errors: req.flash('createExternalUserErrors'),
    })
  }

  const post = async (req, res) => {
    const isGroupManager = Boolean(res.locals && res.locals.user && res.locals.user.groupManager)
    const user = trimObjValues(req.body)

    const errors = validateCreate(user, isGroupManager)

    const sendAudit = audit(req.session.userDetails.username, {
      authSource: 'external',
      user,
    })
    await sendAudit(ManageUsersEvent.CREATE_USER_ATTEMPT)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
      await sendAudit(ManageUsersEvent.CREATE_USER_FAILURE)
    } else {
      try {
        const groupCodes = user.groupCode !== '' ? [user.groupCode] : undefined
        const updatedUser = { email: user.email, firstName: user.firstName, lastName: user.lastName, groupCodes }
        const userId = await createExternalUser(res.locals, updatedUser)
        req.session.searchUrl = searchUrl
        req.session.searchResultsUrl = `${searchUrl}?user=${encodeURIComponent(user.email)}`
        res.render('createExternalUserSuccess.njk', {
          email: user.email,
          detailsLink: `${manageUrl}/${userId}/details`,
        })
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_USER_FAILURE)
        if (err.status === 400 && err.response && err.response.body) {
          const { emailError: error, userMessage: errorDescription } = err.response.body

          const updateDes = errorDescription
            .replace('Validation failure:', '')
            .split(';')
            .map((x) => x.split(':'))
          const eachFieldIdWithError = updateDes[0].toString().split(',')

          const description =
            error === 'email.domain'
              ? 'The email domain is not allowed.  Enter a work email address'
              : eachFieldIdWithError[1]

          const errorDetails = [{ href: `#${eachFieldIdWithError[0].toString().trim()}`, text: description }]
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
  createExternalUserFactory,
}
