const createBulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  const getCreateNew = async (req, res) => {
    if (req.session?.bulkUserRoles === undefined) {
      req.session.bulkUserRoles = {}
    }
    res.render('createBulkUserRolesRequest.njk', { details: req.session.bulkUserRoles })
  }
  return {
    getCreateNew,
  }
}

module.exports = { createBulkUserRolesRequestsFactory }
