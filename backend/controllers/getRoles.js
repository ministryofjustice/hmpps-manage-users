const getRolesFactory = (elite2Api) => {
  const getRoles = async (req, res) => {
    const { hasAdminRole } = req.query
    const data =
      hasAdminRole === 'true' ? await elite2Api.getRolesAdmin(res.locals) : await elite2Api.getRoles(res.locals)
    res.json(data)
  }

  return {
    getRoles,
  }
}

module.exports = {
  getRolesFactory,
}
