const querystring = require('querystring')
const { ManageUsersEvent, audit } = require('../audit')
const config = require('../config').default

const size = 20

const searchFactory = (
  paginationService,
  getAssignablePrisonsApi,
  getSearchableRolesApi,
  findUsersApi,
  searchUrl,
  maintainUrl,
  searchTitle,
  allowDownload,
) => {
  return async (req, res) => {
    const [prisonDropdownValues, searchableRoles] = await Promise.all([
      getAssignablePrisonsApi(res.locals),
      getSearchableRolesApi(res.locals),
    ])
    const roleDropdownValues = searchableRoles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))
    const showPrisonDropdown = Boolean(res.locals?.user?.maintainAccessAdmin)

    const currentFilter = parseFilter(req.query)

    const { page } = req.query

    const caseload = currentFilter.groupCode && currentFilter.groupCode[0]
    const { roleCode: accessRoles } = currentFilter

    const { username } = req.session.userDetails
    const sendAudit = audit(username, { authSource: 'nomis', filter: currentFilter })
    await sendAudit(ManageUsersEvent.SEARCH_USER_ATTEMPT)

    try {
      const { searchResults, totalElements, number } = await findUsersApi({
        locals: res.locals,
        user: currentFilter.user,
        caseload,
        accessRoles,
        activeCaseload: currentFilter.restrictToActiveGroup ? caseload : undefined,
        status: currentFilter.status,
        size,
        page,
        inclusiveRoles: currentFilter.inclusiveRoles,
        showOnlyLSAs: currentFilter.showOnlyLSAs,
      })
      req.session.searchResultsUrl = req.originalUrl
      req.session.searchTitle = searchTitle
      req.session.searchUrl = req.originalUrl

      const results = searchResults.map((user) => ({
        ...user,
      }))

      res.render('searchDpsUsers.njk', {
        searchTitle,
        searchUrl,
        prisonDropdownValues,
        roleDropdownValues,
        showPrisonDropdown,
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
        lsaDownloadUrl:
          allowDownload(res) &&
          currentFilter.showOnlyLSAs &&
          `/search-with-filter-dps-users/lsa-download?${querystring.stringify(currentFilter)}`,
        hideLsaDownloadLink: allowDownload(res) && totalElements > config.downloadRecordLimit ? true : undefined,
        downloadRecordLimit: config.downloadRecordLimit,
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.SEARCH_USER_FAILURE)
      throw error
    }
  }
}

function parseFilter(query) {
  const roleCode = toArrayOrUndefined(query.roleCode)
  const groupCode = toArrayOrUndefined(query.groupCode)
  return {
    user: query.user?.trim(),
    status: query.status || 'ALL',
    roleCode,
    groupCode,
    restrictToActiveGroup: query.restrictToActiveGroup !== 'false',
    inclusiveRoles: query.inclusiveRoles,
    showOnlyLSAs: query.showOnlyLSAs,
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
