const mapUsernameAndEmail = (u) => {
  if (u.email) return u.username.toLowerCase() === u.email ? u.email : `${u.username} / ${u.email}`
  return u.username
}

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
  const index = async (req, res) => {
    const [groupDropdownValues, searchableRoles] = await Promise.all([
      getAssignableGroups(res.locals),
      getSearchableRolesApi(res.locals),
    ])
    const roleDropdownValues = searchableRoles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))

    res.render('searchExternalUsers.njk', {
      searchTitle,
      searchUrl,
      groupDropdownValues,
      roleDropdownValues,
    })
  }

  const results = async (req, res) => {
    const { user, groupCode, roleCode, size, status, page, offset } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && parseInt(page, 10)) || 0
    const pageOffset = (offset && parseInt(offset, 10)) || 0

    // stash away the search url in the session to provide in breadcrumbs to go back
    req.session.searchResultsUrl = req.originalUrl
    delete req.session.searchTitle
    delete req.session.searchUrl

    const searchResults = await searchApi({
      locals: res.locals,
      user,
      groupCode,
      roleCode,
      status,
      pageNumber,
      pageSize,
      pageOffset,
    })

    const searchResultsWithUsernameEmailCombined = searchResults.map((u) => ({
      usernameAndEmail: mapUsernameAndEmail(u),
      ...u,
    }))

    res.render('externalSearchResults.njk', {
      searchTitle,
      searchUrl,
      maintainUrl,
      results: searchResultsWithUsernameEmailCombined,
      pagination: paginationService.getPagination(
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      username: user,
      errors: req.flash('errors'),
      downloadUrl:
        allowDownload(res) &&
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl.replace('/results', '/download')}`),
    })
  }

  return { index, results }
}

module.exports = {
  searchFactory,
}
