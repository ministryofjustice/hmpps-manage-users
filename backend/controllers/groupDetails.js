const groupDetailsFactory = (getGroupDetailsApi, deleteChildGroupApi, maintainUrl) => {
  const index = async (req, res) => {
    const { group } = req.params
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    const groupDetails = await getGroupDetailsApi(res.locals, group)

    res.render('groupDetails.njk', {
      groupDetails,
      hasMaintainAuthUsers,
      maintainUrl,
    })
  }

  const deleteChildGroup = async (req, res) => {
    const { pgroup, group } = req.params
    const groupUrl = `${maintainUrl}/${pgroup}`
    try {
      await deleteChildGroupApi(res.locals, group)
      res.redirect(groupUrl)
    } catch (error) {
      if (error.status === 400) {
        // user already removed from group
        res.redirect(req.originalUrl)
      } else {
        throw error
      }
    }
  }

  return { index, deleteChildGroup }
}

module.exports = {
  groupDetailsFactory,
}
