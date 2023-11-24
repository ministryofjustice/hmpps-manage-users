const { auditService, USER_ID_SUBJECT_TYPE } = require('hmpps-audit-client')
const { validateDpsUserCreate } = require('./dpsUserValidation')
const { trimObjValues, removeForwardApostrophe } = require('../utils/utils')

const createDpsUserFactory = (getCaseloads, createDpsUser, createUserUrl, manageUrl) => {
  const stashStateAndRedirectToCreateUser = (req, res) => {
    res.redirect(createUserUrl)
  }

  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createDpsUserErrors', errors)
    req.flash('user', user)
    res.redirect(req.originalUrl)
  }
  const userTypes = new Map()
  userTypes.set('DPS_ADM', 'Central Admin')
  userTypes.set('DPS_GEN', 'General')
  userTypes.set('DPS_LSA', 'Local System Administrator (LSA)')

  const caseloadText = (user) => {
    return `Select a default ${user.userType === 'DPS_LSA' ? 'local admin group' : 'caseload'}`
  }

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

      const currentUserTypeDesc = userTypes.get(user.userType)
      res.render('createDpsUser.njk', {
        title: `Create a DPS ${currentUserTypeDesc} user`,
        showCaseloadDropdown,
        ...user,
        caseloadTitle: caseloadText(user),
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
      (user.firstName = removeForwardApostrophe(user.firstName)),
      (user.lastName = removeForwardApostrophe(user.lastName)),
      user.defaultCaseloadId,
      user.userType !== 'DPS_ADM',
      caseloadText(user),
    )
    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        const { username } = req.session.userDetails
        const userDetails = await createDpsUser(res.locals, user)
        await auditService.sendAuditMessage({
          action: 'CREATE_DPS_USER',
          who: username,
          subjectId: userDetails.username,
          subjectType: USER_ID_SUBJECT_TYPE,
          details: JSON.stringify({ user }),
        })
        res.render('createDpsUserSuccess.njk', {
          email: `${userDetails.primaryEmail}`,
          detailsLink: `${manageUrl}/${userDetails.username}/details`,
        })
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToIndex(req, res, errorDetails, [user])
        } else if (err.status === 409 && err.response && err.response.body.errorCode === 601) {
          const usernameError = [{ href: '#username', text: 'Username already exists' }]
          stashStateAndRedirectToIndex(req, res, usernameError, [user])
        } else if (err.status === 409 && err.response && err.response.body.errorCode === 602) {
          const emailDomainError = [{ href: '#email', text: 'Invalid Email domain' }]
          stashStateAndRedirectToIndex(req, res, emailDomainError, [user])
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
