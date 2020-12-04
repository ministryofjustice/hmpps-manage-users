const { serviceUnavailableMessage } = require('../common-messages')
const contextProperties = require('../contextProperties')

const externalSearchFactory = (
  paginationService,
  getAssignableGroupsApi,
  getSearchableRolesApi,
  searchApi,
  searchUrl,
  maintainUrl,
  searchTitle,
  logError
) => {
  const index = async (req, res) => {
    try {
      const assignableGroups = await getAssignableGroupsApi(res.locals)
      const groupDropdownValues = assignableGroups.map((g) => ({
        text: g.groupName,
        value: g.groupCode,
      }))
      const searchableRoles = await getSearchableRolesApi(res.locals)
      const roleDropdownValues = searchableRoles.map((r) => ({
        text: r.roleName,
        value: r.roleCode,
      }))

      res.render('search.njk', {
        searchTitle,
        searchUrl,
        groupDropdownValues,
        roleDropdownValues,
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: searchUrl })
    }
  }

  const results = async (req, res) => {
    const { user, groupCode, roleCode, size, page } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && parseInt(page, 10)) || 0

    try {
      const searchResults = await searchApi(res.locals, user, groupCode, roleCode, pageNumber, pageSize)
      const pageResponse = contextProperties.getPageable(res.locals)

      res.render('externalSearchResults.njk', {
        searchTitle,
        searchUrl,
        maintainUrl,
        results: searchResults,
        pagination: paginationService.getPagination(
          pageResponse,
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`)
        ),
        errors: req.flash('errors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: searchUrl })
    }
  }

  return { index, results }
}

module.exports = {
  externalSearchFactory,
}
