const selectGroupsFactory = (getGroups, maintainUrl) => {
  const index = async (req, res) => {
    const assignableGroups = await getGroups(res.locals)
    res.render('groups.njk', {
      groupValues: assignableGroups,
      maintainUrl,
      errors: req.flash('groupError'),
    })
  }

  return { index }
}

module.exports = {
  selectGroupsFactory,
}
