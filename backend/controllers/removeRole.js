const removeRoleFactory = (prisonApi) => {
  const removeRole = async (req, res) => {
    const { username, roleCode } = req.query
    await prisonApi.removeRole(res.locals, username, roleCode)
    res.json({})
  }

  return {
    removeRole,
  }
}

module.exports = {
  removeRoleFactory,
}
