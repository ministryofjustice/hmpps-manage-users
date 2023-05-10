const { trimObjValues } = require('../utils/utils')
const { validateLinkedAdminUserCreate } = require('./dpsUserValidation')
const { validateUserName } = require('./dpsUserValidation')

const createLinkedDpsUserFactory = (
  getCaseloads,
  createLinkedAdminUser,
  createLinkedLsaUser,
  createLinkedGeneralUser,
  searchUser,
  createLinkedDpsUserUrl,
  creatDpsUserUrl,
) => {
  const stashStateAndRedirectToCreateLinkedDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(createLinkedDpsUserUrl)
  }

  const stashStateAndRedirectToCreateDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(creatDpsUserUrl)
  }

  const stashStateAndRedirectToLinkedUserIndex = (req, res, errors, user) => {
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
      if (req.query.action === 'searchUser') {
        stashStateAndRedirectToCreateLinkedDpsUser(req, res)
      } else {
        stashStateAndRedirectToCreateLinkedDpsUser(req, res)
      }
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
        // For Creating a non linked user
        stashStateAndRedirectToCreateDpsUser(req, res, [user])
      }
    }
  }

  const post = (req, res) => {
    const user = trimObjValues(req.body)
    if (user.createUser === 'create-admin' || user.createUser === 'create-lsa' || user.createUser === 'create-gen') {
      postCreateUser(req, res)
    } else if (user.searchUser !== null) {
      postSearchUser(req, res)
    }
  }
  const postCreateUser = async (req, res) => {
    const user = trimObjValues(req.body)
    // TODO : extend validation to linking existing admin to gen
    // const errors = validateLinkedAdminUserCreate(user.existingUsername, user.adminUsername)
    const errors = []
    if (errors.length > 0) {
      stashStateAndRedirectToLinkedUserIndex(req, res, errors, [user])
    } else {
      try {
        user.userExists = 'true'
        if (user.createUser === 'create-admin') {
          user.userType = 'DPS_ADM'
          const linkedAdminRequest = { existingUsername: user.existingUsername, adminUsername: user.adminUsername }
          await createLinkedAdminUser(res.locals, linkedAdminRequest)
        } else if (user.createUser === 'create-lsa') {
          user.userType = 'DPS_LSA'
          const linkedLsaRequest = {
            existingUsername: user.existingUsername,
            adminUsername: user.adminUsername,
            localAdminGroup: user.defaultCaseloadId,
          }
          await createLinkedLsaUser(res.locals, linkedLsaRequest)
        } else {
          user.userType = 'DPS_GEN'
          const linkedGeneralRequest = {
            existingAdminUsername: user.adminUsername,
            generalUsername: user.generalUsername,
            defaultCaseloadId: user.defaultCaseloadId,
          }
          await createLinkedGeneralUser(res.locals, linkedGeneralRequest)
        }
        res.render('createLinkedDpsUserSuccess.njk', {})
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToLinkedUserIndex(req, res, errorDetails, [user])
        } else if (err.status === 409) {
          const usernameError = [{ href: '#existingUsername', text: 'Username already exists' }]
          stashStateAndRedirectToLinkedUserIndex(req, res, usernameError, [user])
        } else if (err.status === 404) {
          const usernameError = [{ href: '#existingUsername', text: 'Username not found' }]
          stashStateAndRedirectToLinkedUserIndex(req, res, usernameError, [user])
        } else {
          throw err
        }
      }
    }
  }

  const postSearchUser = async (req, res) => {
    const user = trimObjValues(req.body)
    // TODO Extend validation to linking new general to exisitng admin
    // const errors = validateUserName(user.existingUsername)
    const errors = []
    const showCaseloadDropdown = Boolean(user.userType !== 'DPS_ADM')
    // TODO Caseload should not be retrieved for admin
    const caseloads = await getCaseloads(res.locals)
    const caseloadDropdownValues = caseloads.map((c) => ({
      text: c.name,
      value: c.id,
    }))

    if (errors.length > 0) {
      stashStateAndRedirectToLinkedUserIndex(req, res, errors, [user])
    } else {
      try {
        let userFound
        if (user.userType !== 'DPS_GEN') {
          userFound = await searchUser(res.locals, user.adminUsername)
        } else {
          userFound = await searchUser(res.locals, user.existingUsername)
        }

        res.render(linkedUserTypeViews.get(user.searchUser), {
          title: `Create a Linked DPS user`,
          userType: user.userType,
          existingUsername: userFound.username,
          adminUsername: userFound.username,
          email: userFound.primaryEmail,
          firstName: userFound.firstName,
          lastName: userFound.lastName,
          showCaseloadDropdown,
          caseloadDropdownValues,
          errors: req.flash('createDpsUserErrors'),
        })
      } catch (err) {
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToLinkedUserIndex(req, res, errorDetails, [user])
        } else if (err.status === 409) {
          const usernameError = [{ href: '#existingUsername', text: 'Username already exists' }]
          stashStateAndRedirectToLinkedUserIndex(req, res, usernameError, [user])
        } else if (err.status === 404) {
          const usernameError = [{ href: '#existingUsername', text: 'Username not found' }]
          stashStateAndRedirectToLinkedUserIndex(req, res, usernameError, [user])
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
