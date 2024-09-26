const { validateCreateGroup } = require('./groupValidation')
const { trimObjValues } = require('../utils/utils')
const { audit, ManageUsersEvent } = require('../audit')

const createGroupFactory = (createGroup, manageGroupUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group) => {
    req.flash('createGroupErrors', errors)
    req.flash('group', group)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const flashGroup = req.flash('group')
    const group = flashGroup != null && flashGroup.length > 0 ? flashGroup[0] : ''
    const groupUrl = manageGroupUrl
    res.render('createGroup.njk', {
      groupUrl,
      ...group,
      errors: req.flash('createGroupErrors'),
    })
  }

  const post = async (req, res) => {
    const group = trimObjValues(req.body)
    group.groupCode = group.groupCode.toUpperCase()
    const { _csrf, ...groupWithoutCsrf } = group

    const errors = validateCreateGroup(group)
    const { username } = req.session.userDetails
    const sendAudit = audit(username, { group: groupWithoutCsrf })
    await sendAudit(ManageUsersEvent.CREATE_GROUP_ATTEMPT)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [group])
      await sendAudit(ManageUsersEvent.CREATE_GROUP_FAILURE)
    } else {
      try {
        await createGroup(res.locals, group)
        res.redirect(`${manageGroupUrl}/${group.groupCode}`)
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_GROUP_FAILURE)
        if (err.status === 409 && err.response && err.response.body) {
          //  group code already exists
          const groupError = [{ href: '#groupCode', text: 'Group code already exists' }]
          stashStateAndRedirectToIndex(req, res, groupError, [group])
        } else {
          throw err
        }
      }
    }
  }
  return { index, post }
}

module.exports = {
  createGroupFactory,
}
