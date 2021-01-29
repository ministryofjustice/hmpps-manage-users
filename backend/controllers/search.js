const mapUsernameAndEmail = (u) => {
  if (u.email) return u.username.toLowerCase() === u.email ? u.email : `${u.username} / ${u.email}`
  return u.username
}

const searchFactory = (
  paginationService,
  getAssignableGroupsApi,
  getSearchableRolesApi,
  searchApi,
  pagingApi,
  searchUrl,
  maintainUrl,
  searchTitle,
) => {
  const searchWithStatus = async ({ locals, user, groupCode, roleCode, status, pageNumber, pageSize, pageOffset }) => {
    const statusSearchResults = await searchApi({
      locals,
      user,
      groupCode,
      roleCode,
      status,
      pageNumber,
      pageSize,
      pageOffset,
    })

    // found some results or searched everywhere, so give up
    if (statusSearchResults.length > 0 || status === 'ALL') return { statusSearchResults, status }

    // try to improve search
    return {
      statusSearchResults: await searchApi({
        locals,
        user,
        groupCode,
        roleCode,
        status: 'ALL',
        pageNumber,
        pageSize,
        pageOffset,
      }),
      status: 'ALL',
    }
  }

  const dpsSearch = getAssignableGroupsApi === undefined

  const index = async (req, res) => {
    const assignableGroups = (!dpsSearch && (await getAssignableGroupsApi(res.locals))) || []
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
      dpsSearch,
    })
  }

  const results = async (req, res) => {
    const { user, groupCode, roleCode, size, status, page, offset } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && parseInt(page, 10)) || 0
    const pageOffset = (offset && parseInt(offset, 10)) || 0

    // stash away the search url in the session to provide in breadcrumbs to go back
    req.session.searchResultsUrl = req.originalUrl

    const { statusSearchResults: searchResults, status: searchedStatus } = await searchWithStatus({
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

    res.render(dpsSearch ? 'dpsSearchResults.njk' : 'externalSearchResults.njk', {
      searchTitle,
      searchUrl,
      maintainUrl,
      results: searchResultsWithUsernameEmailCombined,
      pagination: paginationService.getPagination(
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      status: searchedStatus,
      groupCode,
      roleCode,
      user,
      errors: req.flash('errors'),
    })
  }

  return { index, results }
}

module.exports = {
  searchFactory,
}
