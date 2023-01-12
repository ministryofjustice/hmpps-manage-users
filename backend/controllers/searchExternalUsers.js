const querystring = require('querystring')

const mapUsernameAndEmail = (u) => {
  if (u.email) return u.username.toLowerCase() === u.email ? u.email : `${u.username} / ${u.email}`
  return u.username
}
const size = 20

const searchFactory = (
  paginationService,
  getAssignableGroups,
  getSearchableRolesApi,
  searchApi,
  pagingApi,
  searchUrl,
  maintainUrl,
  searchTitle,
  allowDownload,
) => {
  return async (req, res) => {
    const [groupDropdownValues, searchableRoles] = await Promise.all([
      getAssignableGroups(res.locals),
      getSearchableRolesApi(res.locals),
    ])
    const roleDropdownValues = searchableRoles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))

    const currentFilter = parseFilter(req.query)

    const { page } = req.query

    // stash away the search url in the session to provide in breadcrumbs to go back
    req.session.searchResultsUrl = req.originalUrl
    delete req.session.searchTitle
    delete req.session.searchUrl

    const searchResults = await searchApi({
      locals: res.locals,
      user: currentFilter.user,
      groupCode: currentFilter.groupCode,
      roleCode: currentFilter.roleCode,
      status: currentFilter.status,
      page,
      size,
    })

    const searchResultsWithUsernameEmailCombined = searchResults.map((u) => ({
      usernameAndEmail: mapUsernameAndEmail(u),
      ...u,
    }))

    res.render('searchExternalUsers.njk', {
      searchTitle,
      searchUrl,
      maintainUrl,
      results: searchResultsWithUsernameEmailCombined,
      pagination: paginationService.getPagination(
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      currentFilter,
      groupDropdownValues,
      roleDropdownValues,
      errors: req.flash('errors'),
      downloadUrl: allowDownload(res) && `/search-external-users/download?${querystring.stringify(currentFilter)}`,
    })
  }
}

function parseFilter(query) {
  return {
    user: query.user?.trim(),
    status: query.status || 'ALL',
    roleCode: query.roleCode,
    groupCode: query.groupCode,
  }
}

module.exports = {
  searchFactory,
}
