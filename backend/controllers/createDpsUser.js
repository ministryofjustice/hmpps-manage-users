const { validateDpsUserCreate } = require('./dpsUserValidation')
const { trimObjValues } = require('../utils')

const createDpsUserFactory = (
  getCaseloads,
  createDpsAdminUser,
  createDpsGeneralUser,
  createDpsLocalAdminUser,
  createUserUrl,
  manageUrl,
) => {
  const stashStateAndRedirectToCreateUser = (req, res) => {
    res.redirect(createUserUrl)
  }

  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createDpsUserErrors', errors)
    req.flash('user', user)
    res.redirect(req.originalUrl)
  }
  const userTypeValues = [
    { value: 'DPS_ADM', text: 'Central Admin', api: createDpsAdminUser },
    { value: 'DPS_GEN', text: 'General', api: createDpsGeneralUser },
    { value: 'DPS_LSA', text: 'Local System Administrator (LSA)', api: createDpsLocalAdminUser },
  ]

  const index = async (req, res) => {
    const flashUser = req.flash('user')
    const user = flashUser != null && flashUser.length > 0 ? flashUser[0] : ''
    // redirect if no user or type configured
    if (user === '' || user.userType === 'undefined') {
      stashStateAndRedirectToCreateUser(req, res)
    } else {
      const caseloads = await getCaseloads(res.locals)

      const caseloadDropdownValues = caseloads.map((c) => ({
        text: c.name,
        value: c.id,
      }))

      const showCaseloadDropdown = Boolean(user.userType !== 'DPS_ADM')

      const currentUserTypeDesc = userTypeValues.find((u) => u.value === user.userType)?.text
      res.render('createDpsUser.njk', {
        title: `Create a DPS ${currentUserTypeDesc} user`,
        showCaseloadDropdown,
        ...user,
        caseloadDropdownValues,
        errors: req.flash('createDpsUserErrors'),
      })
    }
  }

  const post = async (req, res) => {
    const user = trimObjValues(req.body)
    const errors = validateDpsUserCreate(
      user.username,
      user.email,
      user.firstName,
      user.lastName,
      user.defaultCaseloadId,
      user.userType !== 'DPS_ADM',
    )

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        const currentUser = userTypeValues.find((u) => u.value === user.userType)
        const userDetails = await currentUser.api(res.locals, user)

        res.render('createDpsUserSuccess.njk', {
          email: `${userDetails.primaryEmail}`,
          detailsLink: `${manageUrl}/${userDetails.username}/details`,
        })
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToIndex(req, res, errorDetails, [user])
        } else if (err.status === 409 && err.response && err.response.body) {
          // username already exists
          const { userMessage } = err.response.body
          const emailError = [{ href: '#username', text: userMessage }]
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
  createDpsUserFactory,
}
