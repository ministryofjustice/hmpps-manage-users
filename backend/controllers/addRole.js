const addRoleFactory = (elite2Api) => {
  const addRole = async (req, res) => {
    const { agencyId, username, roleCode } = req.query
    await elite2Api.addRole(res.locals, agencyId, username, roleCode)
    res.json({})
  }

  return {
    addRole,
  }
}

module.exports = {
  addRoleFactory,
}
