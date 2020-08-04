const contextUserRolesFactory = (prisonApi) => {
  const contextUserRoles = async (req, res) => {
    const { username, hasAdminRole } = req.query
    const data = await prisonApi.contextUserRoles(res.locals, username, hasAdminRole)
    res.json(data)
  }

  return {
    contextUserRoles,
  }
}

module.exports = {
  contextUserRolesFactory,
}
