const { validateCreateGroup } = require('./groupValidation')
const { trimObjValues } = require('../utils/utils')
const { auditWithSubject, ManageUsersSubjectType, ManageUsersEvent } = require('../audit')
const cleanUpRedirect = require('../utils/urlUtils').default

const createChildGroupFactory = (createChildGroup, manageGroupUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group) => {
    req.flash('createChildGroupErrors', errors)
    req.flash('group', group)
    res.redirect(cleanUpRedirect(req.originalUrl))
  }

  const index = async (req, res) => {
    const { pgroup } = req.params
    const flashGroup = req.flash('group')
    const group = flashGroup != null && flashGroup.length > 0 ? flashGroup[0] : ''
    const groupUrl = `${manageGroupUrl}/${pgroup}`
    res.render('createChildGroup.njk', {
      groupUrl,
      ...group,
      errors: req.flash('createChildGroupErrors'),
    })
  }

  const post = async (req, res) => {
    const { pgroup } = req.params
    const group = trimObjValues(req.body)
    group.groupCode = group.groupCode.toUpperCase()
    group.parentGroupCode = pgroup
    const errors = validateCreateGroup(group)

    const sendAudit = auditWithSubject(
      req.session.userDetails.username,
      group.groupCode,
      ManageUsersSubjectType.GROUP_CODE,
      { parentGroup: pgroup },
    )
    await sendAudit(ManageUsersEvent.CREATE_GROUP_ATTEMPT)

    if (errors.length > 0) {
      await sendAudit(ManageUsersEvent.CREATE_GROUP_FAILURE)
      stashStateAndRedirectToIndex(req, res, errors, [group])
    } else {
      try {
        await createChildGroup(res.locals, group)

        res.redirect(`${manageGroupUrl}/${pgroup}`)
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_GROUP_FAILURE)
        if (err.status === 409 && err.response && err.response.body) {
          // child group code already exists
          const emailError = [{ href: '#groupCode', text: 'Group code already exists' }]
          stashStateAndRedirectToIndex(req, res, emailError, [group])
        } else {
          throw err
        }
      }
    }
  }
  return { index, post }
}

module.exports = {
  createChildGroupFactory,
}
