const { validateGroupName } = require('./groupValidation')
const { trimObjValues } = require('../utils/utils')
const { auditWithSubject, ManageUsersEvent, ManageUsersSubjectType } = require('../audit')

const childGroupAmendmentFactory = (getChildGroupDetailsApi, changeChildGroupNameApi, title, manageGroupUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, groupName) => {
    req.flash('changeGroupErrors', errors)
    req.flash('changeGroupName', groupName)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { pgroup, group } = req.params
    const groupUrl = `${manageGroupUrl}/${pgroup}`

    const groupDetails = await getChildGroupDetailsApi(res.locals, group)
    const flashGroup = req.flash('changeGroupName')
    const groupName = flashGroup != null && flashGroup.length > 0 ? flashGroup[0] : groupDetails.groupName

    res.render('changeGroupName.njk', {
      title,
      groupUrl,
      currentGroupName: groupName,
      errors: req.flash('changeGroupErrors'),
    })
  }

  const post = async (req, res) => {
    const { pgroup, group } = req.params
    const { groupName } = trimObjValues(req.body)
    const groupUrl = `${manageGroupUrl}/${pgroup}`
    const sendAudit = auditWithSubject(req.session.userDetails.username, group, ManageUsersSubjectType.GROUP_CODE, {
      parentGroupCode: pgroup,
      newGroupName: groupName,
    })
    await sendAudit(ManageUsersEvent.UPDATE_GROUP_ATTEMPT)
    try {
      const errors = validateGroupName(groupName)
      if (errors.length > 0) {
        await sendAudit(ManageUsersEvent.UPDATE_GROUP_FAILURE)
        stashStateAndRedirectToIndex(req, res, errors, [groupName])
      } else {
        await changeChildGroupNameApi(res.locals, group, groupName)
        res.redirect(groupUrl)
      }
    } catch (err) {
      await sendAudit(ManageUsersEvent.UPDATE_GROUP_FAILURE)
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#groupName', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, [groupName])
      } else {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  childGroupAmendmentFactory,
}
