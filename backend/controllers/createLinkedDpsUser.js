const { trimObjValues } = require('../utils/utils')
const { validateUserForSearch } = require('./linkUserSearchValidation')
const {
  validateLinkedAdminUserCreate,
  validateLinkedLsaUserCreate,
  validateLinkedGeneralUserCreate,
} = require('./linkedAccountValidation')
const { auditWithSubject, ManageUsersEvent, ManageUsersSubjectType } = require('../audit')

const createLinkedDpsUserFactory = (
  getCaseloads,
  createLinkedAdminUser,
  createLinkedLsaUser,
  createLinkedGeneralUser,
  searchUser,
  createLinkedDpsUserUrl,
  creatDpsUserUrl,
  createUserUrl,
  manageUserUrl,
) => {
  const stashStateAndRedirectToCreateLinkedDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(createLinkedDpsUserUrl)
  }

  const stashStateAndRedirectToCreateUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(createUserUrl)
  }

  const stashStateAndRedirectToCreateDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(creatDpsUserUrl)
  }

  const stashStateAndRedirectToLinkedUserIndex = async (req, res, errors, user) => {
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
    // redirect if no user or type is configured in request
    if (user === '' || user.userType === 'undefined') {
      if (req.query.action === 'searchUser') {
        stashStateAndRedirectToCreateLinkedDpsUser(req, res)
      } else {
        stashStateAndRedirectToCreateUser(req, res)
      }
    } else {
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
        // For Creating a non-linked user
        stashStateAndRedirectToCreateDpsUser(req, res, [user])
      }
    }
  }

  const post = async (req, res) => {
    const user = trimObjValues(req.body)
    if (user.createUser !== undefined) {
      await postCreateUser(req, res)
    } else if (user.searchUser !== null) {
      await postSearchUser(req, res)
    }
  }

  const postSearchUser = async (req, res) => {
    const user = trimObjValues(req.body)
    user.userExists = 'true'
    user.userType = user.searchUser
    const errors = validateUserForSearch(user.existingUsername)
    const showCaseloadDropdown = Boolean(user.userType !== 'DPS_ADM')
    const caseloads = await getCaseloads(res.locals)
    const caseloadDropdownValues = caseloads.map((c) => ({
      text: c.name,
      value: c.id,
    }))

    const sendAudit = auditWithSubject(
      req.session.userDetails.username,
      user.existingUsername,
      ManageUsersSubjectType.USER_ID,
      {
        action: 'create-search',
        existingUsername: user.existingUsername,
      },
    )
    await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT)

    if (errors.length > 0) {
      await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_FAILURE)
      stashStateAndRedirectToLinkedUserIndex(req, res, errors, [user])
    } else {
      try {
        const userFound = await searchUser(res.locals, user.existingUsername)
        res.render(linkedUserTypeViews.get(user.searchUser), {
          userType: user.userType,
          existingUsername: userFound.username,
          email: userFound.primaryEmail,
          firstName: userFound.firstName,
          lastName: userFound.lastName,
          showCaseloadDropdown,
          caseloadDropdownValues,
          errors: req.flash('createDpsUserErrors'),
        })
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_FAILURE)
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToLinkedUserIndex(req, res, errorDetails, [user])
        } else if (err.status === 409) {
          const usernameError = [{ href: '#existingUsername', text: 'Linked Username already exists' }]
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
  const postCreateUser = async (req, res) => {
    const user = trimObjValues(req.body)
    user.userExists = 'true'
    let errors
    let newUserId
    if (user.createUser === 'create-admin') {
      user.userType = 'DPS_ADM'
      newUserId = '#adminUsername'
      errors = validateLinkedAdminUserCreate(user.existingUsername, user.adminUsername)
    } else if (user.createUser === 'create-lsa') {
      user.userType = 'DPS_LSA'
      newUserId = '#adminUsername'
      errors = validateLinkedLsaUserCreate(user.existingUsername, user.adminUsername, user.defaultCaseloadId)
    } else {
      user.userType = 'DPS_GEN'
      newUserId = '#generalUsername'
      errors = validateLinkedGeneralUserCreate(user.existingUsername, user.generalUsername, user.defaultCaseloadId)
    }

    const auditMessage = {
      action: user.createUser,
      existingUsername: user.existingUsername,
      adminUsername: user.adminUsername,
      generalUsername: user.generalUsername,
    }
    const sendAudit = auditWithSubject(
      req.session.userDetails.username,
      user.existingUsername,
      ManageUsersSubjectType.USER_ID,
      auditMessage,
    )
    await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT)

    if (errors.length > 0) {
      await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_FAILURE)
      stashStateAndRedirectToLinkedUserIndex(req, res, errors, [user])
    } else {
      try {
        let userNameDetailsLink
        if (user.createUser === 'create-admin') {
          const linkedAdminRequest = { existingUsername: user.existingUsername, adminUsername: user.adminUsername }
          const linkedAdminUserDetails = await createLinkedAdminUser(res.locals, linkedAdminRequest)
          userNameDetailsLink = linkedAdminUserDetails.adminAccount.username
        } else if (user.createUser === 'create-lsa') {
          const linkedLsaRequest = {
            existingUsername: user.existingUsername,
            adminUsername: user.adminUsername,
            localAdminGroup: user.defaultCaseloadId,
          }
          const linkLsaUserDetails = await createLinkedLsaUser(res.locals, linkedLsaRequest)
          userNameDetailsLink = linkLsaUserDetails.adminAccount.username
        } else {
          const linkedGeneralRequest = {
            existingAdminUsername: user.existingUsername,
            generalUsername: user.generalUsername,
            defaultCaseloadId: user.defaultCaseloadId,
          }
          const linkGeneralUserDetails = await createLinkedGeneralUser(res.locals, linkedGeneralRequest)
          userNameDetailsLink = linkGeneralUserDetails.generalAccount.username
        }
        res.render('createLinkedDpsUserSuccess.njk', {
          detailsLink: `${manageUserUrl}/${userNameDetailsLink}/details`,
        })
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_LINKED_USER_FAILURE)
        if (err.status === 400 && err.response && err.response.body) {
          const { userMessage } = err.response.body
          const errorDetails = [{ text: userMessage }]
          stashStateAndRedirectToLinkedUserIndex(req, res, errorDetails, [user])
        } else if (
          err.status === 409 &&
          err.response.body.userMessage !== undefined &&
          err.response.body.userMessage.includes('already exists for this staff member')
        ) {
          const usernameError = [{ href: '#existingUsername', text: 'Username already linked to another account' }]
          stashStateAndRedirectToLinkedUserIndex(req, res, usernameError, [user])
        } else if (err.status === 409) {
          const usernameError = [{ href: newUserId, text: 'Username already exists' }]
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
