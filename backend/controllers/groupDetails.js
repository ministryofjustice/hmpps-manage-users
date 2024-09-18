const { auditWithSubject, ManageUsersSubjectType, ManageUsersEvent } = require('../audit')

const groupDetailsFactory = (getGroupDetailsApi, deleteChildGroupApi, maintainUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    req.flash('group', group)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { group } = req.params
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const { username } = req.session.userDetails
    const sendAudit = auditWithSubject(username, group, ManageUsersSubjectType.GROUP_CODE)
    await sendAudit(ManageUsersEvent.VIEW_GROUP_DETAILS_ATTEMPT)

    try {
      const groupDetails = await getGroupDetailsApi(res.locals, group)

      res.render('groupDetails.njk', {
        groupDetails,
        hasMaintainAuthUsers,
        maintainUrl,
        errors: req.flash('deleteGroupErrors'),
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.VIEW_GROUP_DETAILS_FAILURE)
      if (error.status === 404) {
        const groupError = [{ href: '#groupCode', text: 'Group does not exist' }]
        req.flash('groupError', groupError)
        res.redirect(maintainUrl)
      } else {
        throw error
      }
    }
  }

  const getGroupDeleteWarn = async (req, res) => {
    const { group } = req.params
    const groupUrl = `${maintainUrl}/${group}`
    const groupChildError = [
      { href: '#groupCode', text: 'You must delete all child groups before you can delete the group' },
    ]
    stashStateAndRedirectToIndex(req, res, groupChildError, [group], groupUrl)
  }

  const deleteChildGroup = async (req, res) => {
    const { pgroup, group } = req.params
    const groupUrl = `${maintainUrl}/${pgroup}`
    const sendAudit = auditWithSubject(req.session.userDetails.username, group, ManageUsersSubjectType.GROUP_CODE, {
      parentGroup: pgroup,
    })
    await sendAudit(ManageUsersEvent.DELETE_GROUP_ATTEMPT)
    try {
      await deleteChildGroupApi(res.locals, group)
      res.redirect(groupUrl)
    } catch (error) {
      await sendAudit(ManageUsersEvent.DELETE_GROUP_FAILURE)
      if (error.status === 400) {
        // child already removed from group
        res.redirect(req.originalUrl)
      } else {
        throw error
      }
    }
  }

  return { index, deleteChildGroup, getGroupDeleteWarn }
}

module.exports = {
  groupDetailsFactory,
}
