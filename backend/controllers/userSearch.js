const search = (prisonApi, res, agencyId, nameFilter, roleFilter) =>
  prisonApi.userSearch(res.locals, {
    nameFilter,
    roleFilter: roleFilter || '',
  })

const adminSearch = (prisonApi, res, agencyId, nameFilter, roleFilter) =>
  prisonApi.userSearchAdmin(res.locals, {
    nameFilter,
    roleFilter: roleFilter || '',
  })

const userSearchFactory = (prisonApi) => {
  const userSearch = async (req, res) => {
    const { agencyId, nameFilter, roleFilter, hasAdminRole } = req.query
    const response =
      hasAdminRole === 'true'
        ? await adminSearch(prisonApi, res, agencyId, nameFilter, roleFilter)
        : await search(prisonApi, res, agencyId, nameFilter, roleFilter)
    res.set(res.locals.responseHeaders)
    res.json(response)
  }

  return {
    userSearch,
  }
}

module.exports = {
  userSearchFactory,
}
