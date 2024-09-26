const { auditWithSubject } = require('../audit/manageUsersAudit')
const { ManageUsersSubjectType } = require('../audit/manageUsersSubjectType')
const { ManageUsersEvent } = require('../audit/manageUsersEvent')

const userDetailsFactory = (
  getUserRolesAndGroupsApi,
  removeUserRoleApi,
  removeGroupApi,
  removeUserCaseloadApi,
  enableUserApi,
  disableUserApi,
  defaultSearchUrl,
  manageUrl,
  defaultSearchTitle,
  showExtraUserDetails,
  canAutoEnableDisableUser,
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { userId } = req.params
    const { username } = req.session.userDetails
    const audit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID)
    await audit(ManageUsersEvent.VIEW_USER_ATTEMPT)

    try {
      const staffUrl = `${manageUrl}/${userId}`
      const hasMaintainAuthUsers = Boolean(res.locals?.user?.maintainAuthUsers)
      const hasMaintainDpsUsersAdmin = Boolean(res.locals?.user?.maintainAccessAdmin)
      const hasManageDPSUserAccount = Boolean(res.locals?.user?.manageDPSUserAccount)

      const searchTitle = req.session.searchTitle ? req.session.searchTitle : defaultSearchTitle
      const searchUrl = req.session.searchUrl ? req.session.searchUrl : defaultSearchUrl
      const searchResultsUrl = req.session.searchResultsUrl ? req.session.searchResultsUrl : searchUrl

      const [user, roles, groups, caseloads] = await getUserRolesAndGroupsApi(
        res.locals,
        userId,
        hasMaintainDpsUsersAdmin,
        hasMaintainAuthUsers,
      )
      res.render('userDetails.njk', {
        searchTitle,
        searchResultsUrl,
        searchUrl,
        staff: { ...user, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        roles,
        groups,
        caseloads: caseloads?.sort(sortAlphabetically),
        hasMaintainDpsUsersAdmin,
        errors: req.flash('deleteGroupErrors'),
        canAutoEnableDisableUser: Boolean(canAutoEnableDisableUser),
        showEnableDisable: Boolean(canAutoEnableDisableUser || hasManageDPSUserAccount),
        showGroups: Boolean(removeGroupApi),
        showExtraUserDetails,
        showUsername: user.email !== user.username.toLowerCase(),
        displayEmailChangeInProgress: !user.verified && user.emailToVerify && user.emailToVerify !== user.email,
      })
    } catch (error) {
      await audit(ManageUsersEvent.VIEW_USER_FAILURE)
      throw error
    }
  }

  const removeRole = async (req, res) => {
    const { userId, role } = req.params
    const { username } = req.session.userDetails
    const staffUrl = `${manageUrl}/${userId}`

    const audit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID, { role })
    await audit(ManageUsersEvent.REMOVE_USER_ROLE_ATTEMPT)

    try {
      await removeUserRoleApi(res.locals, userId, role)
      res.redirect(`${staffUrl}/details`)
    } catch (error) {
      await audit(ManageUsersEvent.REMOVE_USER_ROLE_FAILURE)
      if (error.status === 400) {
        // role already removed from group
        res.redirect(req.originalUrl)
      } else {
        throw error
      }
    }
  }

  const removeGroup = async (req, res) => {
    const { userId, group } = req.params
    const staffUrl = `${manageUrl}/${userId}`
    const { username } = req.session.userDetails

    const sendAudit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID, { group })
    await sendAudit(ManageUsersEvent.REMOVE_USER_GROUP_ATTEMPT)

    try {
      await removeGroupApi(res.locals, userId, group)
      res.redirect(`${staffUrl}/details`)
    } catch (error) {
      await sendAudit(ManageUsersEvent.REMOVE_USER_GROUP_FAILURE)

      if (error.status === 400) {
        // user already removed from group
        res.redirect(req.originalUrl)
      } else if (error.status === 403 && error.response && error.response.body) {
        const groupError = [
          {
            href: '#groupCode',
            text: 'You are not allowed to remove the last group from this user, please deactivate their account instead',
          },
        ]
        stashStateAndRedirectToIndex(req, res, groupError, [group], `${staffUrl}/details`)
      } else {
        throw error
      }
    }
  }

  const removeUserCaseload = async (req, res) => {
    const { userId, caseload } = req.params
    const { username } = req.session.userDetails
    const staffUrl = `${manageUrl}/${userId}`

    const audit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID, { caseload })
    await audit(ManageUsersEvent.REMOVE_USER_CASELOAD_ATTEMPT)

    try {
      await removeUserCaseloadApi(res.locals, userId, caseload)
      res.redirect(`${staffUrl}/details`)
    } catch (error) {
      await audit(ManageUsersEvent.REMOVE_USER_CASELOAD_FAILURE)
      if (error.status === 400) {
        res.redirect(req.originalUrl)
      } else if (error.status === 404) {
        // caseload already removed
        res.redirect(`${staffUrl}/details`)
      } else {
        throw error
      }
    }
  }
  const enableUser = async (req, res) => {
    const { userId } = req.params
    const { username } = req.session.userDetails
    const staffUrl = `${manageUrl}/${userId}`

    const sendAudit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID)
    await sendAudit(ManageUsersEvent.ENABLE_USER_ATTEMPT)

    try {
      await enableUserApi(res.locals, userId)
    } catch (error) {
      await sendAudit(ManageUsersEvent.ENABLE_USER_FAILURE)
      throw error
    }
    res.redirect(`${staffUrl}/details`)
  }

  const disableUser = async (req, res) => {
    const { userId } = req.params
    const { username } = req.session.userDetails
    const staffUrl = `${manageUrl}/${userId}`

    const sendAudit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID)
    await sendAudit(ManageUsersEvent.DISABLE_USER_ATTEMPT)

    try {
      await disableUserApi(res.locals, userId)
    } catch (error) {
      await sendAudit(ManageUsersEvent.DISABLE_USER_FAILURE)
      throw error
    }
    res.redirect(`${staffUrl}/details`)
  }

  return { index, removeRole, removeGroup, removeUserCaseload, enableUser, disableUser }
}

function sortAlphabetically(caseload1, caseload2) {
  if (caseload1.name < caseload2.name) {
    return -1
  }
  if (caseload1.name > caseload2.name) {
    return 1
  }
  return 0
}

module.exports = {
  userDetailsFactory,
}
