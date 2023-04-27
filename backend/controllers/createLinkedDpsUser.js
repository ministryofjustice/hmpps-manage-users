const { trimObjValues } = require('../utils/utils')
const { validateLinkedAdminUserCreate } = require('./dpsUserValidation')

const createLinkedDpsUserFactory = (getCaseloads, createLinkedUser, createLinkedDpsUserUrl, creatDpsUserUrl) => {
  const stashStateAndRedirectToCreateLinkedDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(createLinkedDpsUserUrl)
  }

  const stashStateAndRedirectToCreateDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(creatDpsUserUrl)
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

  const linkedUserTypeViews = new Map()
  linkedUserTypeViews.set('DPS_ADM', 'createDpsLinkedAdminUser.njk')
  linkedUserTypeViews.set('DPS_GEN', 'createDpsLinkedGeneralUser.njk')
  linkedUserTypeViews.set('DPS_LSA', 'createDpsLinkedLsaUser.njk')

  const caseloadText = (user) => {
    return `Select a default ${user.userType === 'DPS_LSA' ? 'local admin group' : 'caseload'}`
  }
  const index = async (req, res) => {
    const flashUser = req.flash('user')
    const user = flashUser != null && flashUser.length > 0 ? flashUser[0] : ''
    // redirect if no user or type configured
    if (user === '' || user.userType === 'undefined') {
      stashStateAndRedirectToCreateLinkedDpsUser(req, res)
    } else {
      // TODO Caseload should not be retrieved for admin
      const caseloads = await getCaseloads(res.locals)
      const caseloadDropdownValues = caseloads.map((c) => ({
        text: c.name,
        value: c.id,
      }))

      const showCaseloadDropdown = Boolean(user.userType !== 'DPS_ADM')
      const currentUserTypeDesc = userTypes.get(user.userType)
      const createUserView = user.userExists === 'true' ? linkedUserTypeViews.get(user.userType) : 'createDpsUser.njk'
      const linkedTitleMarker = user.userExists === 'true' ? 'Linked' : ''

      if (user.userExists === 'true') {
        res.render(createUserView, {
          title: `Create a ${linkedTitleMarker} DPS ${currentUserTypeDesc} user`,
          userType: user.userType,
          showCaseloadDropdown,
          ...user,
          caseloadTitle: caseloadText(user),
          caseloadDropdownValues,
          errors: req.flash('createDpsUserErrors'),
        })
      } else {
        stashStateAndRedirectToCreateDpsUser(req, res, [user])
      }
    }
  }

  const post = async (req, res) => {
    const user = trimObjValues(req.body)
    const errors = validateLinkedAdminUserCreate(user.existingUsername, user.adminUsername)
    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      try {
        const linkedAdminRequest = { existingUsername: user.existingUsername, adminUsername: user.adminUsername }
        await createLinkedUser(res.locals, linkedAdminRequest)
        res.render('createLinkedDpsUserSuccess.njk', {})
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToIndex(req, res, errorDetails, [user])
        } else if (err.status === 409) {
          const usernameError = [{ href: '#existingUsername', text: 'Username already exists' }]
          stashStateAndRedirectToIndex(req, res, usernameError, [user])
        } else if (err.status === 404) {
          const usernameError = [{ href: '#existingUsername', text: 'Username not found' }]
          stashStateAndRedirectToIndex(req, res, usernameError, [user])
        } else {
          throw err
        }
      }
    }
  }

  return { index, post }
}

module.exports = {
  createLinkedDpsUserFactory,
}
