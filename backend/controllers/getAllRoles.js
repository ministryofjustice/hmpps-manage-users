const { audit, ManageUsersEvent } = require('../audit')

const viewRolesFactory = (paginationService, pagingApi, getPagedRolesApi, maintainUrl) => {
  const index = async (req, res) => {
    const { size, page } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && parseInt(page, 10)) || 0

    req.session.searchUrl = req.originalUrl
    req.session.searchResultsUrl = req.originalUrl

    const currentFilter = parseFilter(req.query)

    const { roleCode, roleName, adminTypes } = currentFilter

    const sendAudit = audit(req.session.userDetails.username)
    await sendAudit(ManageUsersEvent.LIST_ROLES_ATTEMPT)

    try {
      const roles = await getPagedRolesApi(res.locals, pageNumber, pageSize, roleName, roleCode, adminTypes)
      res.render('roles.njk', {
        roles,
        currentFilter,
        pagination: paginationService.getPagination(
          pagingApi(res.locals),
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
        ),
        maintainUrl,
        errors: req.flash('roleError'),
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.LIST_ROLES_FAILURE)
      throw error
    }
  }

  return { index }
}

function parseFilter(query) {
  return {
    roleCode: query.roleCode,
    roleName: query.roleName,
    adminTypes: query.adminTypes || 'ALL',
  }
}

module.exports = {
  viewRolesFactory,
}
