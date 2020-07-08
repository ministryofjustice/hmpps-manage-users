const getRolesFactory = (prisonApi) => {
  const getRoles = async (req, res) => {
    const { hasAdminRole } = req.query
    const data =
      hasAdminRole === 'true' ? await prisonApi.getRolesAdmin(res.locals) : await prisonApi.getRoles(res.locals)
    res.json(data)
  }

  return {
    getRoles,
  }
}

module.exports = {
  getRolesFactory,
}
