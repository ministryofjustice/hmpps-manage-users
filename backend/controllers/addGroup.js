const { serviceUnavailableMessage } = require('../common-messages')

const selectGroupFactory = (getUserAndGroups, saveGroup, searchUrl, manageUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addGroupErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${manageUrl}/${username}`

    try {
      const [user, assignableGroups, userGroups] = await getUserAndGroups(res.locals, username)
      const userGroupsCodes = new Set(userGroups.map((g) => g.groupCode))
      const groupDropdownValues = assignableGroups
        .filter((g) => !userGroupsCodes.has(g.groupCode))
        .map((g) => ({ text: g.groupName, value: g.groupCode }))

      res.render('addGroup.njk', {
        maintainTitle,
        maintainUrl: searchUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        groupDropdownValues: [{ text: '', value: '' }].concat(groupDropdownValues),
        errors: req.flash('addGroupErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { group } = req.body
    const staffUrl = `${manageUrl}/${username}`

    if (!group) {
      const errors = [{ href: '#group', text: 'Select a group' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      try {
        await saveGroup(res.locals, username, group)
        res.redirect(staffUrl)
      } catch (error) {
        if (error.status === 409) {
          // user is already in the group
          const errors = [{ href: '#group', text: 'User already belongs to that group' }]
          stashStateAndRedirectToIndex(req, res, errors)
        } else {
          logError(req.originalUrl, error, serviceUnavailableMessage)
          res.render('error.njk', { url: `${staffUrl}/select-group` })
        }
      }
    }
  }

  return { index, post }
}

module.exports = { selectGroupFactory }
