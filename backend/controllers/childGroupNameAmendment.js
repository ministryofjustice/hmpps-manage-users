const { validateGroupName } = require('./groupValidation')
const { serviceUnavailableMessage } = require('../common-messages')
const { trimObjValues } = require('../utils')

const childGroupAmendmentFactory = (
  getChildGroupDetailsApi,
  changeChildGroupNameApi,
  title,
  manageGroupUrl,
  logError
) => {
  const stashStateAndRedirectToIndex = (req, res, errors, groupName) => {
    req.flash('changeGroupErrors', errors)
    req.flash('changeGroupName', groupName)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { group } = req.params
    const groupUrl = `${manageGroupUrl}/${group}`

    try {
      const groupDetails = await getChildGroupDetailsApi(res.locals, group)
      const flashGroup = req.flash('changeGroupName')
      const groupName = flashGroup != null && flashGroup.length > 0 ? flashGroup[0] : groupDetails.groupName

      res.render('changeGroupName.njk', {
        title,
        groupUrl,
        currentGroupName: groupName,
        errors: req.flash('changeGroupErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: groupUrl })
    }
  }

  const post = async (req, res) => {
    const { pgroup, group } = req.params
    const { groupName } = trimObjValues(req.body)
    const groupUrl = `${manageGroupUrl}/${pgroup}`
    try {
      const errors = validateGroupName(groupName)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [groupName])
      } else {
        await changeChildGroupNameApi(res.locals, group, groupName)
        res.redirect(groupUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#groupName', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, [groupName])
      } else {
        logError(req.originalUrl, err, serviceUnavailableMessage)
        res.render('error.njk', { url: `${groupUrl}/change-group-name` })
      }
    }
  }

  return { index, post }
}

module.exports = {
  childGroupAmendmentFactory,
}
