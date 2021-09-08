const searchFactory = (
  paginationService,
  getAssignableGroupsOrPrisonsApi,
  getSearchableRolesApi,
  searchApi,
  pagingApi,
  searchUrl,
  searchTitle,
  dpsSearch,
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

    const { offset } = req.query

    const pageSize = 20
    const pageOffset = (offset && parseInt(offset, 10)) || 0

    const groupCode = currentFilter.groupCode && currentFilter.groupCode[0]
    const roleCode = (currentFilter.roleCode && currentFilter.roleCode[0]) ?? ''

    const searchResults = await searchApi({
      locals: res.locals,
      user: currentFilter.user ?? '',
      groupCode,
      roleCode,
      activeCaseload: currentFilter.restrictToActiveGroup ? groupCode : undefined,
      status: currentFilter.status,
      pageSize,
      pageOffset,
    })

    const results = searchResults.map((user) => ({
      usernameAndEmail: mapUsernameAndEmail(user),
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
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
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

function mapUsernameAndEmail(user) {
  if (user.email) return user.username.toLowerCase() === user.email ? user.email : `${user.username} / ${user.email}`
  return user.username
}

module.exports = {
  searchFactory,
}
