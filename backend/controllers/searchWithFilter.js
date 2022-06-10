const querystring = require('querystring')
const config = require('../config')

const size = 20

const searchFactory = (
  paginationService,
  getAssignableGroupsOrPrisonsApi,
  getSearchableRolesApi,
  findUsersApi,
  searchUrl,
  maintainUrl,
  searchTitle,
  dpsSearch,
  allowDownload,
) => {
  return async (req, res) => {
    const [groupOrPrisonDropdownValues, searchableRoles] = await Promise.all([
      getAssignableGroupsOrPrisonsApi(res.locals),
      getSearchableRolesApi(res.locals),
    ])
    const roleDropdownValues = searchableRoles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))
    const showGroupOrPrisonDropdown = Boolean(res.locals?.user?.maintainAccessAdmin || !dpsSearch)

    const currentFilter = parseFilter(req.query)

    const { page } = req.query

    const caseload = currentFilter.groupCode && currentFilter.groupCode[0]
    const { roleCode: accessRoles } = currentFilter

    const { searchResults, totalElements, number } = await findUsersApi({
      locals: res.locals,
      user: currentFilter.user,
      caseload,
      accessRoles,
      activeCaseload: currentFilter.restrictToActiveGroup ? caseload : undefined,
      status: currentFilter.status,
      size,
      page,
    })
    req.session.searchResultsUrl = req.originalUrl
    req.session.searchTitle = searchTitle
    req.session.searchUrl = req.originalUrl

    const results = searchResults.map((user) => ({
      ...user,
    }))

    res.render('searchWithFilter.njk', {
      searchTitle,
      searchUrl,
      groupOrPrisonDropdownValues,
      roleDropdownValues,
      showGroupOrPrisonDropdown,
      dpsSearch,
      groupOrPrison: dpsSearch ? 'caseload' : 'group',
      currentFilter,
      results,
      pagination: paginationService.getPagination(
        { totalElements, page: number, size },
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      downloadUrl:
        allowDownload(res) && `/search-with-filter-dps-users/user-download?${querystring.stringify(currentFilter)}`,
      hideDownloadLink: allowDownload(res) && totalElements > config.downloadRecordLimit ? true : undefined,
      maintainUrl,
      downloadRecordLimit: config.downloadRecordLimit,
    })
  }
}

function parseFilter(query) {
  const roleCode = toArrayOrUndefined(query.roleCode)
  const groupCode = toArrayOrUndefined(query.groupCode)
  return {
    user: query.user,
    status: query.status || 'ALL',
    roleCode,
    groupCode,
    restrictToActiveGroup: query.restrictToActiveGroup !== 'false',
  }
}

function toArrayOrUndefined(maybeArray) {
  if (Array.isArray(maybeArray)) {
    return maybeArray
  }
  if (maybeArray) {
    return [maybeArray]
  }
  return undefined
}

module.exports = {
  searchFactory,
  parseFilter,
}
