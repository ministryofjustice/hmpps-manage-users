const validateCreate = ({ userType }) => {
  const errors = []
  if (!userType || userType === '--') {
    errors.push({ href: '#userType', text: 'Select a user type' })
  }
  return errors
}

const createUserFactory = (createDpsUserOptionsUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createUserErrors', errors)
    req.flash('user', user)
    res.redirect(req.originalUrl)
  }
  const stashStateAndRedirectToCreateUserOptions = (req, res, user) => {
    req.flash('user', user)
    res.redirect(createDpsUserOptionsUrl)
  }

  const index = async (req, res) => {
    const flashUser = req.flash('user')
    const user = flashUser != null && flashUser.length > 0 ? flashUser[0] : ''

    const userTypeValues = [
      { value: 'DPS_ADM', text: 'Central Admin' },
      { value: 'DPS_GEN', text: 'General User' },
      { value: 'DPS_LSA', text: 'Local System Administrator (LSA)' },
    ]

    res.render('createUser.njk', {
      ...user,
      userTypeValues,
      errors: req.flash('createUserErrors'),
    })
  }

  const post = async (req, res) => {
    const user = req.body
    const errors = validateCreate(user)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        stashStateAndRedirectToCreateUserOptions(req, res, [user])
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
