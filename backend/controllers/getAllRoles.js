const viewRolesFactory = (paginationService, pagingApi, getAllRolesApi, maintainUrl) => {
  const index = async (req, res) => {
    const { size, page, offset } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && parseInt(page, 10)) || 0
    const pageOffset = (offset && parseInt(offset, 10)) || 0

    req.session.searchResultsUrl = req.originalUrl

    const allRoles = await getAllRolesApi(res.locals, pageNumber, pageSize, pageOffset)

    res.render('roles.njk', {
      roles: allRoles.map((r) => ({ text: r.roleName, value: r.roleCode })),
      pagination: paginationService.getPagination(
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      maintainUrl,
      errors: req.flash('roleError'),
    })
  }

  return { index }
}

module.exports = {
  viewRolesFactory,
}
