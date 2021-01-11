const { serviceUnavailableMessage } = require('../common-messages')
const { validateCreateGroup } = require('./groupValidation')
const { trimObjValues } = require('../utils')

const createChildGroupFactory = (createChildGroup, manageGroupUrl, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group) => {
    req.flash('createChildGroupErrors', errors)
    req.flash('group', group)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { pgroup } = req.params
    const flashGroup = req.flash('group')
    const group = flashGroup != null && flashGroup.length > 0 ? flashGroup[0] : ''
    const groupUrl = `${manageGroupUrl}/${pgroup}`
    try {
      res.render('createChildGroup.njk', {
        groupUrl,
        ...group,
        errors: req.flash('createChildGroupErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: groupUrl })
    }
  }

  const post = async (req, res) => {
    const { pgroup } = req.params
    const group = trimObjValues(req.body)
    group.groupCode = group.groupCode.toUpperCase()
    group.parentGroupCode = pgroup
    const errors = validateCreateGroup(group)
    const groupUrl = `${manageGroupUrl}/${pgroup}`

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [group])
    } else {
      try {
        await createChildGroup(res.locals, group)

        res.redirect(`${manageGroupUrl}/${pgroup}`)
      } catch (err) {
        if (err.status === 409 && err.response && err.response.body) {
          // child group code already exists
          const emailError = [{ href: '#groupCode', text: 'Group code already exists' }]
          stashStateAndRedirectToIndex(req, res, emailError, [group])
        } else {
          logError(req.originalUrl, err, serviceUnavailableMessage)
          res.render('error.njk', { url: groupUrl })
        }
      }
    }
  }
  return { index, post }
}

module.exports = {
  createChildGroupFactory,
}
