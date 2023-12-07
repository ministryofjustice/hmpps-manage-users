const { v4 } = require('uuid')
const { auditService } = require('@ministryofjustice/hmpps-audit-client')

const groupDetailsFactory = (getGroupDetailsApi, deleteChildGroupApi, maintainUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    req.flash('group', group)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { group } = req.params
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const auditCorrelationId = v4()
    const { username } = req.session.userDetails
    await auditService.sendAuditMessage({
      action: 'VIEW_GROUP_DETAILS_ATTEMPT',
      who: username,
      correlationId: auditCorrelationId,
      service: 'hmpps-manage-users',
      details: JSON.stringify({ groupCode: group }),
    })

    try {
      const groupDetails = await getGroupDetailsApi(res.locals, group)

      res.render('groupDetails.njk', {
        groupDetails,
        hasMaintainAuthUsers,
        maintainUrl,
        errors: req.flash('deleteGroupErrors'),
      })
    } catch (error) {
      await auditService.sendAuditMessage({
        action: 'VIEW_GROUP_DETAILS_FAILURE',
        who: username,
        correlationId: auditCorrelationId,
        service: 'hmpps-manage-users',
        details: JSON.stringify({ groupCode: group }),
      })
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
    try {
      await deleteChildGroupApi(res.locals, group)
      res.redirect(groupUrl)
    } catch (error) {
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
