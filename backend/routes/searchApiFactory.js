const contextProperties = require('../contextProperties')

function searchApiFacade(prisonApi, oauthApi) {
  const searchApi = async ({
    locals: context,
    user: nameFilter,
    roleCode,
    status,
    groupCode,
    activeCaseload,
    pageSize: size,
    pageOffset: offset,
  }) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)

    contextProperties.setRequestPagination(context, { offset, size })
    const searchResults = await (hasAdminRole
      ? prisonApi.userSearchAdmin(context, {
          nameFilter,
          roleFilter: roleCode,
          status,
          caseload: groupCode,
          activeCaseload,
        })
      : prisonApi.userSearch(context, { nameFilter, roleFilter: roleCode, status }))

    if (searchResults.length === 0) return searchResults

    // now augment with auth email addresses
    const emails = await oauthApi.userEmails(
      context,
      searchResults.map((user) => user.username),
    )
    const emailMap = new Map(emails.map((obj) => [obj.username, obj.email]))

    return searchResults.map((user) => ({ ...user, email: emailMap.get(user.username) }))
  }

  const searchableRoles = (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    return hasAdminRole ? prisonApi.getRolesAdmin(context) : prisonApi.getRoles(context)
  }

  const caseloads = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await prisonApi.getCaseloads(context))
      .map((g) => ({
        text: g.description,
        value: g.agencyId,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  return {
    searchApi,
    searchableRoles,
    caseloads,
  }
}

module.exports = (prisonApi, oauthApi) => searchApiFacade(prisonApi, oauthApi)
