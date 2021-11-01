const contextProperties = require('../contextProperties')

function searchApiFacade(prisonApi, oauthApi, nomisUsersAndRolesApi) {
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

  const findUsersApi = async ({
    locals: context,
    user: nameFilter,
    accessRoles,
    status,
    caseload,
    activeCaseload,
    size,
    page,
  }) => {
    const { content, totalElements, number } = await nomisUsersAndRolesApi.userSearch(context, {
      nameFilter,
      accessRoles,
      caseload,
      activeCaseload,
      status,
      size,
      page,
    })

    if (content.length === 0)
      return {
        searchResults: content,
        totalElements,
        number,
      }

    // now augment with auth email addresses
    const emails = await oauthApi.userEmails(
      context,
      content.map((user) => user.username),
    )
    const emailMap = new Map(emails.map((obj) => [obj.username, obj.email]))

    return {
      searchResults: content.map((user) => ({ ...user, email: emailMap.get(user.username) })),
      totalElements,
      number,
    }
  }

  const searchableRoles = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)

    return (await nomisUsersAndRolesApi.getRoles(context, hasAdminRole)).sort((a, b) => a.name?.localeCompare(b.name))
  }

  const prisons = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await prisonApi.getPrisons(context))
      .map((prison) => ({
        text: prison.description,
        value: prison.agencyId,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  const caseloads = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await nomisUsersAndRolesApi.getCaseloads(context))
      .map((caseload) => ({
        text: caseload.name,
        value: caseload.id,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  return {
    searchApi,
    searchableRoles,
    caseloads,
    prisons,
    findUsersApi,
  }
}

module.exports = (prisonApi, oauthApi, nomisUsersAndRolesApi) =>
  searchApiFacade(prisonApi, oauthApi, nomisUsersAndRolesApi)
