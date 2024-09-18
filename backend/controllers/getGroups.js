const { ManageUsersEvent, audit } = require('../audit')

const selectGroupsFactory = (getAssignableGroups, maintainUrl) => {
  const index = async (req, res) => {
    const sendAudit = audit(req.session.userDetails.username)
    await sendAudit(ManageUsersEvent.LIST_GROUPS_ATTEMPT)
    try {
      const assignableGroups = await getAssignableGroups(res.locals)
      res.render('groups.njk', {
        groupValues: assignableGroups.map((g) => ({ text: g.groupName, value: g.groupCode })),
        maintainUrl,
        errors: req.flash('groupError'),
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.LIST_GROUPS_FAILURE)
      throw error
    }
  }

  const search = async (req, res) => {
    const { groupCode } = req.body
    if (!groupCode) {
      req.flash('groupError', [{ href: '#groupCode', text: 'Enter a group code' }])
    }
    res.redirect(`${maintainUrl}/${groupCode}`)
  }

  return { index, search }
}

module.exports = {
  selectGroupsFactory,
}
