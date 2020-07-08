const addRoleFactory = (prisonApi) => {
  const addRole = async (req, res) => {
    const { agencyId, username, roleCode } = req.query
    await prisonApi.addRole(res.locals, agencyId, username, roleCode)
    res.json({})
  }

  return {
    addRole,
  }
}

module.exports = {
  addRoleFactory,
}
