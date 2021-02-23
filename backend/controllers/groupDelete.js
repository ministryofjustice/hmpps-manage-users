const groupDeleteFactory = (getGroupDetailsApi, deleteGroupApi, maintainUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, group, url) => {
    req.flash('deleteGroupErrors', errors)
    req.flash('group', group)
    res.redirect(url)
  }

  const index = async (req, res) => {
    const { group } = req.params
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    try {
      const groupDetails = await getGroupDetailsApi(res.locals, group)
      const groupUrl = `${maintainUrl}/${group}`

      res.render('groupDelete.njk', {
        group,
        groupUrl,
        groupDetails,
        hasMaintainAuthUsers,
        maintainUrl,
      })
    } catch (error) {
      if (error.status === 404) {
        const groupChildError = [{ href: '#groupCode', text: 'Group does not exist' }]
        req.flash('groupError', groupChildError)
        res.redirect(maintainUrl)
      } else {
        throw error
      }
    }
  }

  const deleteGroup = async (req, res) => {
    const { group } = req.params
    try {
      await deleteGroupApi(res.locals, group)
      res.redirect(`${maintainUrl}`)
    } catch (error) {
      if (error.status === 400) {
        // user already removed from group
        res.redirect(req.originalUrl)
      } else if (error.status === 409 && error.response && error.response.body) {
        // group has child groups
        const groupDeleteError = [
          { href: '#groupCode', text: 'Group has child groups please delete before trying to delete parent group' },
        ]
        stashStateAndRedirectToIndex(req, res, groupDeleteError, [group])
      } else {
        throw error
      }
    }
  }

  return { index, deleteGroup }
}

module.exports = {
  groupDeleteFactory,
}
