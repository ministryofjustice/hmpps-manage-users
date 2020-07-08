const removeRoleFactory = (prisonApi) => {
  const removeRole = async (req, res) => {
    const { agencyId, username, roleCode } = req.query
    await prisonApi.removeRole(res.locals, agencyId, username, roleCode)
    res.json({})
  }

  return {
    removeRole,
  }
}

module.exports = {
  removeRoleFactory,
}
