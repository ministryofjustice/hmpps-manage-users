const { serviceUnavailableMessage } = require('../common-messages')

const selectGroupFactory = (getUserAndGroups, saveGroup, maintainUrl, maintainTitle, logError) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addGroupErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${maintainUrl}/${username}`

    try {
      const [assignableGroups, user] = await getUserAndGroups(res.locals, username)
      const groupDropdownValues = assignableGroups.map((g) => ({
        text: g.groupName,
        value: g.groupCode,
      }))

      res.render('addGroup.njk', {
        maintainTitle,
        maintainUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        groupDropdownValues,
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
    const staffUrl = `${maintainUrl}/${username}`

    try {
      if (!group) {
        const errors = [{ href: '#group', text: 'Select a group' }]
        stashStateAndRedirectToIndex(req, res, errors)
      } else {
        await saveGroup(res.locals, username, group)
        res.redirect(staffUrl)
      }
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: `${staffUrl}/select-group` })
    }
  }

  return { index, post }
}

module.exports = { selectGroupFactory }
