const { validateGroupName } = require('./groupValidation')
const { trimObjValues } = require('../utils/utils')
const { auditService } = require('../services/auditService')

const groupAmendmentFactory = (getGroupDetailsApi, changeGroupNameApi, title, manageGroupUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, groupName) => {
    req.flash('changeGroupErrors', errors)
    req.flash('changeGroupName', groupName)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { group } = req.params
    const groupUrl = `${manageGroupUrl}/${group}`

    const groupDetails = await getGroupDetailsApi(res.locals, group)
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
    const { group } = req.params
    const { groupName } = trimObjValues(req.body)
    const groupUrl = `${manageGroupUrl}/${group}`
    try {
      const errors = validateGroupName(groupName)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [groupName])
      } else {
        await changeGroupNameApi(res.locals, group, groupName)
        const { username } = req.session.userDetails
        await auditService.sendAuditMessage({
          action: 'CHANGE_GROUP_NAME',
          who: username,
          details: JSON.stringify({ group, newGroupName: groupName }),
        })
        res.redirect(groupUrl)
      }
    } catch (err) {
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
  groupAmendmentFactory,
}
