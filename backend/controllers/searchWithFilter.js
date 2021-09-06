const searchFactory = (getAssignableGroupsOrPrisonsApi, getSearchableRolesApi, searchUrl, searchTitle, dpsSearch) => {
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
    res.render('searchWithFilter.njk', {
      searchTitle,
      searchUrl,
      groupOrPrisonDropdownValues,
      roleDropdownValues,
      showGroupOrPrisonDropdown,
      dpsSearch,
      groupOrPrison: dpsSearch ? 'caseload' : 'group',
      currentFilter,
    })
  }
}

function parseFilter(query) {
  const roleCode = toArrayOrUndefined(query.roleCode)
  const activeCaseload = toArrayOrUndefined(query.activeCaseload)
  return {
    user: query.user,
    status: query.status || 'ALL',
    roleCode,
    activeCaseload,
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
}
