const selectGroupFactory = (getUserAndGroups, saveGroup, searchUrl, manageUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addGroupErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username, userId } = req.params
    const staffUrl = `${manageUrl}/${username}/${userId}/details`

    const [user, assignableGroups, userGroups] = await getUserAndGroups(res.locals, username, userId)
    const userGroupsCodes = new Set(userGroups.map((g) => g.groupCode))
    const groupDropdownValues = assignableGroups
      .filter((g) => !userGroupsCodes.has(g.groupCode))
      .map((g) => ({ text: g.groupName, value: g.groupCode }))

    res.render('addGroup.njk', {
      staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      groupDropdownValues,
      errors: req.flash('addGroupErrors'),
    })
  }

  const post = async (req, res) => {
    const { username, userId } = req.params
    const { group } = req.body
    const staffUrl = `${manageUrl}/${username}/${userId}/details`

    if (!group) {
      const errors = [{ href: '#group', text: 'Select a group' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      try {
        await saveGroup(res.locals, username, group)
        res.redirect(`${staffUrl}`)
      } catch (error) {
        if (error.status === 403) {
          // user is already in the group
          const errors = [
            {
              href: '#group',
              text: 'You are not able to maintain this user anymore, user does not belong to any groups you manage',
            },
          ]
          stashStateAndRedirectToIndex(req, res, errors)
        } else if (error.status === 409) {
          // user is already in the group
          const errors = [{ href: '#group', text: 'User already belongs to that group' }]
          stashStateAndRedirectToIndex(req, res, errors)
        } else {
          throw error
        }
      }
    }
  }

  return { index, post }
}

module.exports = { selectGroupFactory }
